import { Effect, pipe } from "effect";
import HTMLParser from "node-html-parser";
import type { TiebaClient } from "../client.ts";
import { InvalidParamError } from "../core/errors.ts";
import { createFormApi } from "../core/form.ts";
import { BASE_URL, CLIENT_TYPE, CLIENT_VERSION } from "../core/http.ts";
import { createProtoApi } from "../core/proto.ts";
import { FrsPageReqIdl } from "../generated/FrsPageReqIdl.ts";
import { FrsPageResIdl } from "../generated/FrsPageResIdl.ts";
import { GetForumDetailReqIdl } from "../generated/GetForumDetailReqIdl.ts";
import { GetForumDetailResIdl } from "../generated/GetForumDetailResIdl.ts";

// ── 获取帖子列表 ──────────────────────────────────────────

export interface GetThreadsParams {
	fname: string;
	page?: number;
	rn?: number;
	sort?: number;
	onlyGood?: boolean;
}

export const getThreads = createProtoApi({
	endpoint: "/c/f/frs/page?cmd=303002",
	reqCodec: FrsPageReqIdl,
	resCodec: FrsPageResIdl,
	buildRequest: (_client, params: GetThreadsParams) => ({
		data: {
			kw: params.fname,
			pn: params.page || 1,
			rn: 105,
			rnNeed: params.rn ? Math.max(params.rn, 30) : 30,
			isGood: params.onlyGood ? 1 : 0,
			sortType: params.sort || 1,
			common: {
				ClientType: CLIENT_TYPE,
				ClientVersion: CLIENT_VERSION,
			},
		},
	}),
	extractResult: (res) => res.data,
});

// ── 获取吧详情 ──────────────────────────────────────────────

export const getForumDetail = createProtoApi({
	endpoint: "/c/f/forum/getforumdetail?cmd=303021",
	reqCodec: GetForumDetailReqIdl,
	resCodec: GetForumDetailResIdl,
	buildRequest: (_client, forumId: number) => ({
		data: {
			forumId: forumId.toString(),
			common: { ClientVersion: CLIENT_VERSION },
		},
	}),
	extractResult: (res) => res.data,
});

// ── 获取吧名 ────────────────────────────────────────────────

export function getForumName(client: TiebaClient, forumId: number) {
	return pipe(
		getForumDetail(client, forumId),
		Effect.map((data) => data?.forumInfo?.forumName ?? ""),
	);
}

// ── 获取吧成员列表 ─────────────────────────────────────────

export interface ForumMemberData {
	portrait: string;
	username: string;
	nickname: string;
}

export interface ForumMemberPageData {
	all: number;
	now: number;
	membersNum: number;
	forumId: number;
	forumName: string;
}

export interface ForumMemberRes {
	data: ForumMemberData[];
	pageData: ForumMemberPageData;
}

export function getForumMembers(forumName: string, page: number) {
	if (page > 500 || page < 1) {
		throw new InvalidParamError("超出合法页面范围，最大允许 500 页");
	}

	return Effect.gen(function* () {
		const url = new URL("/bawu2/platform/listMemberInfo", BASE_URL);
		url.searchParams.append("word", forumName);
		url.searchParams.append("pn", page.toString());
		url.searchParams.append("ie", "utf-8");

		const buf = yield* pipe(
			Effect.tryPromise(() => fetch(url.toString())),
			Effect.andThen((res) => Effect.tryPromise(() => res.arrayBuffer())),
		);

		const decoder = new TextDecoder("gbk");
		const resText = decoder.decode(buf);
		const doc = HTMLParser.parse(resText);
		const data = doc.querySelectorAll("a.user_name").map((element) => ({
			portrait: element.attributes.href.slice(14),
			username: element.attributes.title,
			nickname: element.innerText,
		}));

		const forumDataText = doc.querySelector("body > div.wrap1 > div > script")
			?.innerText as string;
		const forumData = JSON.parse(
			forumDataText.slice(43, forumDataText.indexOf(";PageData.user.balv")),
		);
		const pageNow = Number.parseInt(
			doc.querySelector(
				"#container > div.tbui_pagination.tbui_pagination_left > ul > li.active > span",
			)?.innerText as string,
			10,
		);
		const pageData: ForumMemberPageData = {
			all: Number.parseInt(
				doc
					.querySelector("span.tbui_total_page")
					?.innerText.slice(1, -1) as string,
				10,
			),
			now: pageNow,
			membersNum: forumData.member_num,
			forumId: forumData.forum_id,
			forumName: forumData.forum_name,
		};
		return { data, pageData } satisfies ForumMemberRes;
	});
}

// ── 关注贴吧 ────────────────────────────────────────────────

/** 关注贴吧。 */
export const followForum = createFormApi<{ fid: number }>({
	endpoint: "/c/c/forum/like",
	buildParams: (params) => ({
		fid: params.fid.toString(),
	}),
});

// ── 取关贴吧 ──────────────────────────────────────────────

/** 取消关注贴吧。 */
export const unfollowForum = createFormApi<{ fid: number }>({
	endpoint: "/c/c/forum/unfavolike",
	buildParams: (params) => ({
		fid: params.fid.toString(),
	}),
});

// ── 签到 ──────────────────────────────────────────────────

/** 贴吧签到（每日打卡）。 */
export const signForum = createFormApi<{ fname: string }>({
	endpoint: "/c/c/forum/sign",
	buildParams: (params) => ({
		kw: params.fname,
	}),
});
