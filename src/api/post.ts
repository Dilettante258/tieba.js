import { Effect, Either, pipe, Schedule } from "effect";
import { getClient } from "../context.ts";
import { TiebaServerError } from "../core/errors.ts";
import { createFormApi } from "../core/form.ts";
import {
	CLIENT_TYPE,
	CLIENT_VERSION,
	CLIENT_VERSION_OLD,
} from "../core/http.ts";
import { createProtoApi } from "../core/proto.ts";
import { AddPostReqIdl } from "../generated/AddPostReqIdl.ts";
import { AddPostResIdl } from "../generated/AddPostResIdl.ts";
import { PbFloorReqIdl } from "../generated/PbFloorReqIdl.ts";
import { PbFloorResIdl } from "../generated/PbFloorResIdl.ts";
import { PbPageReqIdl } from "../generated/PbPageReqIdl.ts";
import { PbPageResIdl, type PbPageResIdl_DataRes } from "../generated/PbPageResIdl.ts";
import { UserPostReqIdl } from "../generated/UserPostReqIdl.ts";
import { UserPostResIdl } from "../generated/UserPostResIdl.ts";
import { processUserPosts } from "../helpers/cache.ts";

// ── 获取帖子回复 ────────────────────────────────────────────

export interface GetPostsParams {
	tid: number;
	page?: number;
	/** 每页返回楼层数，贴吧接口上限 30 */
	rn?: number;
	/**
	 * 排序类型：
	 * - 1：时间倒序
	 * - 2：热门排序
	 * - 3 及以上：时间正序
	 */
	sort?: number;
	onlyThreadAuthor?: boolean;
	withComment?: boolean;
	commentRn?: number;
	commentsSortByTime?: boolean;
}

const MAX_PAGE = 600;

function packPostsProto(params: GetPostsParams): Uint8Array {
	const rn = Math.min(Math.max(params.rn || 30, 1), 30);

	const data: Parameters<typeof PbPageReqIdl.fromPartial>['0']['data'] = {
		kz: params.tid.toString(),
		pn: params.page || 1,
		// 单页最大 30
		rn,
		// 1 时间倒序，2 热门排序，3 及以上时间正序
		r: params.sort || 3,
		lz: params.onlyThreadAuthor ? 1 : 0,
		common: {
			ClientType: CLIENT_TYPE,
			ClientVersion: CLIENT_VERSION,
		},
	};

	if (params.withComment) {
		data.common!.BDUSS = getClient().bduss;
		data.withFloor = 1;
		data.floorSortType = params.commentsSortByTime ? 0 : 1;
		data.floorRn = params.commentRn || 4;
	}

	const req = PbPageReqIdl.fromPartial({ data });
	return PbPageReqIdl.encode(req).finish();
}

function parsePostsBody(buffer: Uint8Array) {
	const res = PbPageResIdl.decode(buffer);
	if (res.error?.errorno) {
		throw new TiebaServerError(res.error.errorno, res.error.errmsg ?? "");
	}
	return res.data;
}

function getSinglePage(params: GetPostsParams) {
	const effect = pipe(
		Effect.succeed(packPostsProto(params)),
		Effect.andThen((buf) =>
			getClient().postProtobuf("/c/f/pb/page?cmd=303002", buf),
		),
		Effect.map(parsePostsBody),
	);

	if (params.withComment) {
		return effect.pipe(
			Effect.retry({
				schedule: Schedule.exponential(1000),
				times: 3,
			}),
		);
	}
	return effect;
}

/**
 * 并发获取多页结果，容忍单页失败。
 * 返回所有成功页的 postList / userList 合并结果。
 */
function fetchPages(
	pages: number[],
	makeParams: (pg: number) => GetPostsParams,
) {
	const effects = pages.map((pg) => getSinglePage(makeParams(pg)));
	return Effect.all(effects, { concurrency: 5, mode: "either" }).pipe(
		Effect.map((results) => {
			const postsArr: PbPageResIdl_DataRes["postList"][] = [];
			const usersArr: PbPageResIdl_DataRes["userList"][] = [];
			for (const r of results) {
				if (Either.isRight(r)) {
					if (r.right?.postList) postsArr.push(r.right.postList);
					if (r.right?.userList) usersArr.push(r.right.userList);
				}
			}
			return { posts: postsArr.flat(1), users: usersArr.flat(1) };
		}),
	);
}

/**
 * 获取帖子回复。
 * - `page: number` — 获取单页
 * - `page: [from, to]` — 获取指定页码范围（闭区间）
 * - `page: "ALL"` — 获取全部（先请求第 1 页获取总页数，再并发抓取剩余页）
 */
export function getPosts(
	tid: number,
	page: number | [number, number] | "ALL",
	options?: Omit<GetPostsParams, "tid" | "page">,
) {
	const makeParams = (pg: number): GetPostsParams => ({
		tid,
		page: pg,
		...options,
	});

	// 单页直接返回
	if (typeof page === "number") {
		return getSinglePage(makeParams(page));
	}

	return Effect.gen(function* () {
		// 先抓起始页，再根据真实总页数裁剪请求范围，避免越界页导致重复内容。
		const from = page === "ALL" ? 1 : Math.max(1, page[0]);
		const requestedLastPage = page === "ALL"
			? MAX_PAGE
			: Math.max(from, page[1]);
		const firstResult = yield* getSinglePage(makeParams(from));
		const totalPage = Math.max(
			1,
			Math.min(firstResult?.page?.totalPage || 1, MAX_PAGE),
		);
		const lastPage =
			page === "ALL"
				? totalPage
				: Math.min(requestedLastPage, totalPage);

		if (page !== "ALL" && from > totalPage) {
			if (firstResult?.postList) firstResult.postList = [];
			if (firstResult?.userList) firstResult.userList = [];
			return firstResult;
		}

		if (from >= lastPage) return firstResult;

		// 并发获取剩余页
		const remaining = Array.from(
			{ length: lastPage - from },
			(_, i) => from + 1 + i,
		);
		const { posts, users } = yield* fetchPages(
			remaining,
			makeParams,
		);

		if (firstResult?.postList) {
			firstResult.postList.push(...posts);
		}
		if (firstResult?.userList) {
			firstResult.userList.push(...users);
		}
		return firstResult;
	});
}

// ── 获取用户发帖 ────────────────────────────────────────────

const getUserPostSingle = createProtoApi({
	endpoint: "/c/u/feed/userpost?cmd=303002",
	reqCodec: UserPostReqIdl,
	resCodec: UserPostResIdl,
	buildRequest: (params: { uid: number; pn: number }) => ({
		data: {
			needContent: 1,
			userId: params.uid.toString(),
			pn: params.pn,
			common: { ClientVersion: CLIENT_VERSION_OLD },
		},
	}),
	extractResult: (res) => res.data?.postList ?? [],
});

/** 获取用户发帖原始 protobuf 数据（不做展平和吧名解析）。 */
export function getRawUserPost(uid: number, pn: number) {
	return getUserPostSingle({ uid, pn });
}

/**
 * 获取用户发帖并展平为 UserPost[]。
 * - `param2: number` — 获取单页
 * - `param2: [from, to]` — 获取指定页码范围（闭区间）
 * @param needForumName 为 true 时通过 API 解析缺失的吧名（默认 true）
 */
export function getUserPost(
	uid: number,
	param2: number | [number, number],
	needForumName = true,
) {
	const raw =
		typeof param2 === "number"
			? getUserPostSingle({ uid, pn: param2 })
			: Effect.all(
					Array.from(
						{ length: param2[1] - param2[0] + 1 },
						(_, i) => param2[0] + i,
					).map((page) => getUserPostSingle({ uid, pn: page })),
				).pipe(Effect.map((posts) => posts.flat()));

	return raw.pipe(
		Effect.andThen((posts) => processUserPosts(posts, needForumName)),
	);
}

// ── 获取楼中楼 ────────────────────────────────────────────

export interface GetCommentsParams {
	tid: number;
	pid: number;
	pn?: number;
}

/** 获取指定回复的楼中楼评论。 */
export const getComments = createProtoApi({
	endpoint: "/c/f/pb/floor?cmd=303002",
	reqCodec: PbFloorReqIdl,
	resCodec: PbFloorResIdl,
	buildRequest: (params: GetCommentsParams) => ({
		data: {
			kz: params.tid.toString(),
			pid: params.pid.toString(),
			pn: params.pn || 1,
			common: {
				ClientType: CLIENT_TYPE,
				ClientVersion: CLIENT_VERSION,
			},
		},
	}),
	extractResult: (res) => res.data,
});

// ── 发帖回复 ──────────────────────────────────────────────

export interface AddPostParams {
	fname: string;
	fid: number;
	tid: number;
	content: string;
	showName?: string;
	isAnonymous?: boolean;
}

/**
 * 回复帖子。
 * 使用 protobuf 端点并伪造设备信息（与 aiotieba 相同方式）。
 */
export function addPost(params: AddPostParams) {
	return Effect.gen(function* () {
		const client = getClient();
		const tbs = yield* client.getTbs();
		const req = AddPostReqIdl.fromPartial({
			data: {
				common: {
					BDUSS: client.bduss,
					ClientType: CLIENT_TYPE,
					ClientVersion: "12.35.1.0",
					tbs,
					ClientId: "wappc_1234567890123_456",
					PhoneImei: "000000000000000",
					from: "1008621x",
					model: "SM-G988N",
					netType: 1,
					pversion: "1.0.3",
					OsVersion: "9",
					brand: "samsung",
				},
				content: params.content,
				fid: params.fid.toString(),
				kw: params.fname,
				tid: params.tid.toString(),
				fromFourmId: params.fid.toString(),
				anonymous: params.isAnonymous ? "1" : "0",
				nameShow: params.showName ?? "",
				canNoForum: "0",
				isFeedback: "0",
				takephotoNum: "0",
				entranceType: "0",
				vcodeTag: "12",
				newVcode: "1",
				isBarrage: "0",
				isAd: "0",
				postFrom: "3",
				isPictxt: "0",
				showCustomFigure: 0,
				isShowBless: 0,
			},
		});
		const buf = AddPostReqIdl.encode(req).finish();
		const resBuf = yield* getClient().postProtobuf("/c/c/post/add?cmd=309731", buf);
		const res = AddPostResIdl.decode(resBuf);
		if (res.error?.errorno) {
			throw new TiebaServerError(res.error.errorno, res.error.errmsg ?? "");
		}
		return res.data;
	});
}

// ── 删帖 / 删除主题 ────────────────────────────────────────

export interface DelPostParams {
	fid: number;
	tid: number;
	pid: number;
}

/** 删除回复。需要吧务权限或帖子所有权。 */
export const delPost = createFormApi<DelPostParams>({
	endpoint: "/c/c/bawu/delpost",
	buildParams: (params) => ({
		fid: params.fid.toString(),
		z: params.tid.toString(),
		pid: params.pid.toString(),
	}),
});

export interface DelThreadParams {
	fid: number;
	tid: number;
}

/** 删除主题帖。需要吧务权限或帖子所有权。 */
export const delThread = createFormApi<DelThreadParams>({
	endpoint: "/c/c/bawu/delthread",
	buildParams: (params) => ({
		fid: params.fid.toString(),
		z: params.tid.toString(),
	}),
});
