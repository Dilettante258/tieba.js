import { Effect, Either, pipe } from "effect";
import type { TiebaClient } from "../client.ts";
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
	no: number;
	id: string;
	name: string;
	name_show: string;
	portrait: string;
	has_concerned: number;
	sex: string;
	is_brand_user: number;
	fans_num: string;
}

export function getUserInfo(_client: TiebaClient, username: string) {
	return getData<UserInfo>(
		`/i/sys/user_json?un=${encodeURIComponent(username)}&ie=utf-8`,
	);
}

// ── 通过 UID 获取用户 ────────────────────────────────────────

export const getUserByUid = createProtoApi({
	endpoint: "/c/u/user/getUserByTiebaUid?cmd=309702",
	reqCodec: GetUserByUidReqIdl,
	resCodec: GetUserByUidResIdl,
	buildRequest: (_client, uid: number) => ({
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
	buildRequest: (_client, id: number | string) => {
		const data: Record<string, unknown> = {
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
	vipInfo?: {
		v_level?: string;
		v_status?: string;
		e_time?: string;
	};
	honor?: {
		manager?: {
			id: string;
			name: string;
		};
		grade?: Record<
			string,
			{
				forum_list: string[];
			}
		>;
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
		Effect.andThen((res) => Effect.succeed(res as UserPanel)),
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

export function getFans(
	client: TiebaClient,
	id: number,
	page: number | "needAll" = 1,
) {
	return Effect.gen(function* () {
		const params = {
			uid: id.toString(),
			page: Number.isInteger(page) ? (page as number).toString() : "1",
		};
		let res = yield* postFormData<FanRes>(
			"/c/u/fans/page",
			client.packRequest(params),
		);

		if (page === "needAll" && res.page.total_page !== "1") {
			const promises: Array<Effect.Effect<FanRes, FetchError>> = [];
			for (let i = 2; i <= Number(res.page.total_page); i++) {
				params.page = i.toString();
				promises.push(
					postFormData<FanRes>("/c/u/fans/page", client.packRequest(params)),
				);
			}
			const results = yield* Effect.all(promises, {
				concurrency: 5,
				mode: "either",
			});
			const successResults = results.filter(Either.isRight);

			res = Object.assign(res, {
				user_list: [
					...res.user_list,
					...successResults.map((i) => i.right.user_list),
				],
			});

			res.user_list
				.filter(
					(user) =>
						typeof user.bazhu_grade === "string" ||
						Array.isArray(user.bazhu_grade),
				)
				.map((user) => Object.assign(user, { bazhu_grade: undefined }));
		}
		return res;
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

export function getFollow(
	client: TiebaClient,
	id: number,
	page: number | "needAll" = 1,
) {
	return Effect.gen(function* () {
		const params = {
			uid: id.toString(),
			page: Number.isInteger(page) ? (page as number).toString() : "1",
		};
		let res = yield* postFormData<FollowRes>(
			"/c/u/follow/followList",
			client.packRequest(params),
		);

		if (page === "needAll" && res.has_more === 1) {
			const promises: Array<Effect.Effect<FollowRes, FetchError>> = [];
			for (let i = 2; i <= res.total_follow_num / 20 + 1; i++) {
				params.page = i.toString();
				promises.push(
					postFormData<FollowRes>(
						"/c/u/follow/followList",
						client.packRequest(params),
					),
				);
			}
			const results = yield* Effect.all(promises, { concurrency: 5 });

			res = Object.assign(res, {
				follow_list: [...res.follow_list, ...results.map((i) => i.follow_list)],
			});
		}
		return res;
	});
}

// ── 获取关注的贴吧 ────────────────────────────────────────

export interface LikeForum {
	forum_id: string;
	forum_name: string;
	level_id: string;
	level_name: string;
	cur_score: string;
	is_sign: string;
}

export function getLikeForum(
	client: TiebaClient,
	id: number,
	page: number | "needAll" = 1,
): Effect.Effect<LikeForum[], FetchError> {
	return Effect.gen(function* () {
		const params = {
			friend_uid: id.toString(),
			page_no: Number.isInteger(page) ? (page as number).toString() : "1",
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
