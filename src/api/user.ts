import { Effect, Either, pipe } from "effect";
import { getClient } from "../context.ts";
import type { FetchError } from "../core/errors.ts";
import { createFormApi } from "../core/form.ts";
import {
	CLIENT_TYPE,
	CLIENT_VERSION,
	getData,
	postFormData,
} from "../core/http.ts";
import { createProtoApi } from "../core/proto.ts";
import { GetUserByUidReqIdl } from "../generated/GetUserByUidReqIdl.ts";
import { GetUserByUidResIdl } from "../generated/GetUserByUidResIdl.ts";
import { ProfileReqIdl } from "../generated/ProfileReqIdl.ts";
import { ProfileResIdl } from "../generated/ProfileResIdl.ts";

// ── 获取用户信息 ─────────────────────────────────────────────

export interface UserInfo {
	name: string;
	name_show: string;
	show_nickname: string;
	portrait: string;
	id: number;
	is_online: boolean;
	is_prison: boolean;
	is_private: boolean;
	is_verify: boolean;
}

interface UserInfoResponse {
	tbs: string;
	raw_name: string;
	id: number;
	creator: UserInfo;
}

export function getUserInfo(username: string) {
	return pipe(
		getData<UserInfoResponse>(
			`/i/sys/user_json?un=${encodeURIComponent(username)}&ie=utf-8`,
		),
		Effect.andThen((res) => res.creator),
	);
}

// ── 通过 UID 获取用户 ────────────────────────────────────────

export const getUserByUid = createProtoApi({
	endpoint: "/c/u/user/getUserByTiebaUid?cmd=309702",
	reqCodec: GetUserByUidReqIdl,
	resCodec: GetUserByUidResIdl,
	buildRequest: (uid: number) => ({
		data: {
			tiebaUid: uid.toString(),
			common: {
				ClientType: CLIENT_TYPE,
				ClientVersion: CLIENT_VERSION,
			},
		},
	}),
	extractResult: (res) => res.data?.user,
});

// ── 获取用户资料 ──────────────────────────────────────────────

export const getProfile = createProtoApi({
	endpoint: "/c/u/user/profile?cmd=303012",
	reqCodec: ProfileReqIdl,
	resCodec: ProfileResIdl,
	buildRequest: (id: number | string) => {
		const data: Parameters<typeof ProfileReqIdl.fromPartial>['0']['data'] = {
			needPostCount: 1,
			pn: 1,
			common: {
				ClientType: CLIENT_TYPE,
				ClientVersion: CLIENT_VERSION,
			},
		};
		if (typeof id === "string") {
			data.friendUidPortrait = id;
		} else {
			data.uid = id.toString();
		}
		return { data };
	},
	extractResult: (res) => res.data,
});

// ── 获取用户面板 ────────────────────────────────────────────

export interface UserPanel {
	tb_vip: boolean;
	followed_count: number;
	vipInfo?: {
		v_level?: string;
		v_status?: string;
		e_time?: string;
	};
	honor?: {
		manager?: {
			manager?: { count: number; forum_list: string[] };
			assist?: { count: number; forum_list: string[] };
		};
		grade?: Record<string, { forum_list: string[] }>;
	};
}

export function getPanel(un: string) {
	return pipe(
		Effect.tryPromise(() =>
			fetch(
				`http://tiebac.baidu.com/home/get/panel?un=${encodeURIComponent(un)}`,
			),
		),
		Effect.andThen((res) => Effect.tryPromise(() => res.json())),
		Effect.andThen(
			(res: { data: UserPanel }) => Effect.succeed(res.data),
		),
	);
}

// ── 获取粉丝列表 ─────────────────────────────────────────────

export interface FanRes {
	page: { total_page: string };
	user_list: Array<{
		id: string;
		name: string;
		name_show: string;
		portrait: string;
		bazhu_grade?: unknown;
	}>;
}

/**
 * 获取粉丝列表。
 * - `page: number` — 获取单页
 * - `page: [from, to]` — 获取指定页码范围（闭区间）
 * - `page: "ALL"` — 获取全部（先请求第 1 页获取总页数，再并发抓取剩余页）
 */
export function getFans(
	id: number,
	page: number | [number, number] | "ALL" = 1,
) {
	const client = getClient();
	const fetchPage = (pg: number) =>
		postFormData<FanRes>(
			"/c/u/fans/page",
			client.packRequest({ uid: id.toString(), page: pg.toString() }),
		);

	if (typeof page === "number") {
		return fetchPage(page);
	}

	return Effect.gen(function* () {
		const from = page === "ALL" ? 1 : Math.max(1, page[0]);
		const requestedLastPage = page === "ALL"
			? Number.POSITIVE_INFINITY
			: Math.max(from, page[1]);
		const firstRes = yield* fetchPage(from);
		const totalPage = Math.max(1, Number(firstRes.page?.total_page ?? 1) || 1);
		const lastPage =
			page === "ALL" ? totalPage : Math.min(requestedLastPage, totalPage);

		if (page !== "ALL" && from > totalPage) {
			firstRes.user_list = [];
			return firstRes;
		}

		if (from >= lastPage) return firstRes;

		const remaining = Array.from(
			{ length: lastPage - from },
			(_, i) => from + 1 + i,
		);
		const results = yield* Effect.all(
			remaining.map((pg) => fetchPage(pg)),
			{ concurrency: 5, mode: "either" },
		);

		const extraUsers = results.filter(Either.isRight).flatMap((r) => {
			const users = r.right.user_list ?? [];
			// 清理 bazhu_grade 异常值（可能为字符串或数组而非对象）
			for (const u of users) {
				if (
					typeof u.bazhu_grade === "string" ||
					Array.isArray(u.bazhu_grade)
				) {
					u.bazhu_grade = undefined;
				}
			}
			return users;
		});

		firstRes.user_list = [...firstRes.user_list, ...extraUsers];
		return firstRes;
	});
}

// ── 获取关注列表 ───────────────────────────────────────────

export interface FollowRes {
	has_more: number;
	total_follow_num: number;
	follow_list: Array<{
		id: string;
		name: string;
		name_show: string;
		portrait: string;
		intro: string;
	}>;
}

/**
 * 获取关注列表。
 * - `page: number` — 获取单页
 * - `page: [from, to]` — 获取指定页码范围（闭区间）
 * - `page: "ALL"` — 获取全部（根据 total_follow_num 推算总页数，每页 20 条）
 */
export function getFollow(
	id: number,
	page: number | [number, number] | "ALL" = 1,
) {
	const client = getClient();
	const fetchPage = (pg: number) =>
		postFormData<FollowRes>(
			"/c/u/follow/followList",
			client.packRequest({ uid: id.toString(), page: pg.toString() }),
		);

	if (typeof page === "number") {
		return fetchPage(page);
	}

	return Effect.gen(function* () {
		const from = page === "ALL" ? 1 : Math.max(1, page[0]);
		const requestedLastPage = page === "ALL"
			? Number.POSITIVE_INFINITY
			: Math.max(from, page[1]);
		const firstRes = yield* fetchPage(from);
		const totalPage = Math.max(1, Math.ceil((firstRes.total_follow_num || 0) / 20));
		const lastPage =
			page === "ALL"
				? totalPage
				: Math.min(requestedLastPage, totalPage);

		if (page !== "ALL" && from > totalPage) {
			firstRes.follow_list = [];
			firstRes.has_more = 0;
			return firstRes;
		}

		if (from >= lastPage) return firstRes;

		const remaining = Array.from(
			{ length: lastPage - from },
			(_, i) => from + 1 + i,
		);
		const results = yield* Effect.all(
			remaining.map((pg) => fetchPage(pg)),
			{ concurrency: 5, mode: "either" },
		);

		const extraFollows = results
			.filter(Either.isRight)
			.flatMap((r) => r.right.follow_list ?? []);

		firstRes.follow_list = [...firstRes.follow_list, ...extraFollows];
		return firstRes;
	});
}

// ── 获取关注的贴吧 ────────────────────────────────────────

export interface LikeForum {
	id: string;
	name: string;
	favo_type: string;
	level_id: string;
	level_name: string;
	cur_score: string;
	levelup_score: string;
	is_forbidden: string;
	avatar: string;
	slogan: string;
}

export function getLikeForum(
	id: number,
	page: number | "ALL" = 1,
): Effect.Effect<LikeForum[], FetchError> {
	const client = getClient();
	return Effect.gen(function* () {
		const params = {
			friend_uid: id.toString(),
			page_no: (typeof page === "number" ? page : 1).toString(),
			page_size: "400",
		};
		const res = yield* postFormData<{
			forum_list: {
				"non-gconforum": LikeForum[];
				gconforum: LikeForum[];
			};
		}>("/c/f/forum/like", client.packRequest(params));

		if (res?.forum_list?.gconforum) {
			return res.forum_list["non-gconforum"]?.concat(res.forum_list.gconforum);
		}
		return res?.forum_list ? res.forum_list["non-gconforum"] : [];
	});
}

/** 用户隐藏关注贴吧时，从 profile 和 panel 中恢复部分关注信息 */
export interface HiddenLikeForum {
	/** 按吧内等级分组的贴吧列表 */
	grade: Record<string, { forum_list: string[] }>;
	/** 不在等级列表中的其他关注贴吧名 */
	plain: string[];
}

/** 当用户隐藏关注贴吧时，通过 profile + panel 获取部分关注信息 */
export function getHiddenLikeForum(id: number) {
	return Effect.gen(function* () {
		const profile = yield* getProfile(id);
		const name = profile?.user?.name ?? "";
		const panel = yield* getPanel(name);
		// profile 中的关注贴吧名
		const profileForums = (profile?.user?.likeForum ?? []).map(
			(f) => f.forumName,
		);
		// panel 中按等级分组的贴吧名
		const gradeForums = Object.values(panel.honor?.grade ?? {}).flatMap(
			(v) => v.forum_list,
		);
		return {
			grade: panel.honor?.grade ?? {},
			plain: profileForums.filter((name) => !gradeForums.includes(name)),
		} satisfies HiddenLikeForum;
	});
}

// ── 关注用户 ─────────────────────────────────────────────

/** 关注用户。 */
export const followUser = createFormApi<{ portrait: string }>({
	endpoint: "/c/c/user/follow",
	buildParams: (params) => ({
		portrait: params.portrait,
	}),
});

// ── 取关用户 ───────────────────────────────────────────────

/** 取消关注用户。 */
export const unfollowUser = createFormApi<{ portrait: string }>({
	endpoint: "/c/c/user/unfollow",
	buildParams: (params) => ({
		portrait: params.portrait,
	}),
});
