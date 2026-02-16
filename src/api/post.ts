import { Effect, Either, pipe, Schedule } from "effect";
import type { TiebaClient } from "../client.ts";
import { type FetchError, TiebaServerError } from "../core/errors.ts";
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
import { PbPageResIdl } from "../generated/PbPageResIdl.ts";
import { UserPostReqIdl } from "../generated/UserPostReqIdl.ts";
import { UserPostResIdl } from "../generated/UserPostResIdl.ts";

// ── 获取帖子回复 ────────────────────────────────────────────

export interface GetPostsParams {
	tid: number;
	page?: number;
	rn?: number;
	sort?: number;
	onlyThreadAuthor?: boolean;
	withComment?: boolean;
	commentRn?: number;
	commentsSortByTime?: boolean;
}

const MAX_PAGE = 600;

function packPostsProto(
	client: TiebaClient,
	params: GetPostsParams,
): Uint8Array {
	const data: Record<string, unknown> = {
		kz: params.tid.toString(),
		pn: params.page || 1,
		rn: params.rn || 30,
		r: params.sort || 3,
		lz: params.onlyThreadAuthor ? 1 : 0,
		common: {
			ClientType: CLIENT_TYPE,
			ClientVersion: CLIENT_VERSION,
		},
	};

	if (params.withComment) {
		(data.common as Record<string, unknown>).BDUSS = client.bduss;
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

function getSinglePage(client: TiebaClient, params: GetPostsParams) {
	const effect = pipe(
		Effect.succeed(packPostsProto(client, params)),
		Effect.andThen((buf) =>
			client.postProtobuf("/c/f/pb/page?cmd=303002", buf),
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

export function getPosts(
	client: TiebaClient,
	tid: number,
	page: number | "ALL",
	options?: Omit<GetPostsParams, "tid" | "page">,
) {
	const makeParams = (pg: number): GetPostsParams => ({
		tid,
		page: pg,
		...options,
	});

	if (page === "ALL") {
		return Effect.gen(function* () {
			const page1 = yield* getSinglePage(client, makeParams(1));
			const totalPage = Math.min(page1?.page?.totalPage || 1, MAX_PAGE);

			let batch = 1;
			if (totalPage > 30 && totalPage <= 100) batch = 4;
			if (totalPage > 100) batch = 6;
			if (totalPage > 300) batch = 8;
			if (totalPage > 500) batch = 12;
			const batchSize = Math.ceil(totalPage / batch);

			const allPosts: unknown[] = [];
			const allUsers: unknown[] = [];

			for (let b = 0; b < batch; b++) {
				const promises: Effect.Effect<typeof page1, FetchError>[] = [];
				for (
					let i = b * batchSize + 2;
					i <= (b + 1) * batchSize && i <= totalPage;
					i++
				) {
					promises.push(getSinglePage(client, makeParams(i)));
				}

				const results = yield* Effect.all(promises, {
					concurrency: 5,
					mode: "either",
				});
				const successResults = results.filter(Either.isRight);
				for (const item of successResults) {
					if (item.right?.postList) allPosts.push(...item.right.postList);
					if (item.right?.userList) allUsers.push(...item.right.userList);
				}

				if (b < batch - 1) {
					yield* Effect.sleep(1000);
				}
			}

			if (page1?.postList) {
				(page1.postList as unknown[]).push(...allPosts);
			}
			if (page1?.userList) {
				(page1.userList as unknown[]).push(...allUsers);
			}
			return page1;
		});
	}

	return getSinglePage(client, makeParams(page));
}

// ── 获取用户发帖 ────────────────────────────────────────────

const getUserPostSingle = createProtoApi({
	endpoint: "/c/u/feed/userpost?cmd=303002",
	reqCodec: UserPostReqIdl,
	resCodec: UserPostResIdl,
	buildRequest: (_client, params: { uid: number; pn: number }) => ({
		data: {
			needContent: 1,
			userId: params.uid.toString(),
			pn: params.pn,
			common: { ClientVersion: CLIENT_VERSION_OLD },
		},
	}),
	extractResult: (res) => res.data?.postList ?? [],
});

export function getRawUserPost(client: TiebaClient, uid: number, pn: number) {
	return getUserPostSingle(client, { uid, pn });
}

export function getUserPost(
	client: TiebaClient,
	uid: number,
	param2: number | [number, number],
) {
	if (typeof param2 === "number") {
		return getUserPostSingle(client, { uid, pn: param2 });
	}

	const [start, end] = param2;
	const effects = Array.from(
		{ length: end - start + 1 },
		(_, i) => start + i,
	).map((page) => getUserPostSingle(client, { uid, pn: page }));

	return Effect.all(effects).pipe(Effect.map((posts) => posts.flat()));
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
	buildRequest: (_client, params: GetCommentsParams) => ({
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
export function addPost(client: TiebaClient, params: AddPostParams) {
	return Effect.gen(function* () {
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
		const resBuf = yield* client.postProtobuf("/c/c/post/add?cmd=309731", buf);
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
