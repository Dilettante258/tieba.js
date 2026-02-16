import type { TiebaClient } from "../client.ts";
import { CLIENT_VERSION, getData, postFormData } from "../core/http.ts";

// ── searchPost ─────────────────────────────────────────────

export interface SearchPostParams {
	fname: string;
	query: string;
	pn?: number;
	rn?: number;
	onlyThread?: boolean;
}

export interface SearchPostResult {
	has_more: number;
	pnum: string;
	post_list: Array<{
		tid: string;
		pid: string;
		title: string;
		content: string;
		time: string;
		fname: string;
		author: { user_name: string; portrait: string };
	}>;
}

/** 搜索吧内帖子。 */
export function searchPost(_client: TiebaClient, params: SearchPostParams) {
	const qs = new URLSearchParams({
		_client_version: CLIENT_VERSION,
		kw: params.fname,
		word: params.query,
		pn: (params.pn || 1).toString(),
		rn: (params.rn || 30).toString(),
		only_thread: params.onlyThread ? "1" : "0",
	});
	return getData<SearchPostResult>(`/c/s/searchpost?${qs}`);
}

// ── searchForum ────────────────────────────────────────────

export interface SearchForumResult {
	has_more: number;
	exact_match?: {
		forum_id: string;
		forum_name: string;
		forum_name_show: string;
	};
	fuzzy_match?: Array<{
		forum_id: string;
		forum_name: string;
		forum_name_show: string;
	}>;
}

/** 按关键词搜索贴吧。 */
export function searchForum(
	client: TiebaClient,
	params: { query: string; pn?: number },
) {
	return postFormData<SearchForumResult>(
		"/c/s/search/forum/search",
		client.packRequest({
			word: params.query,
			page: (params.pn || 1).toString(),
		}),
	);
}
