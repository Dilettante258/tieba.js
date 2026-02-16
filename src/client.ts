import { Effect, type Effect as EffectNS } from "effect";
import { getTbs } from "./api/auth.ts";
import {
	followForum,
	getForumDetail,
	getForumMembers,
	getForumName,
	getThreads,
	type GetThreadsParams,
	signForum,
	unfollowForum,
} from "./api/forum.ts";
import { agree, type AgreeParams, disagree } from "./api/interaction.ts";
import {
	blockUser,
	type BlockUserParams,
	goodThread,
	type GoodThreadParams,
	recoverPost,
	recoverThread,
	topThread,
	unblockUser,
	type UnblockUserParams,
	ungoodThread,
	untopThread,
} from "./api/moderation.ts";
import {
	addPost,
	type AddPostParams,
	delPost,
	type DelPostParams,
	delThread,
	type DelThreadParams,
	getComments,
	type GetCommentsParams,
	getPosts,
	type GetPostsParams,
	getRawUserPost,
	getUserPost,
} from "./api/post.ts";
import {
	searchForum,
	searchPost,
	type SearchPostParams,
} from "./api/search.ts";
import {
	getFans,
	getFollow,
	getLikeForum,
	getPanel,
	getProfile,
	getUserByUid,
	getUserInfo,
	followUser,
	unfollowUser,
} from "./api/user.ts";
import { packRequest } from "./core/auth.ts";
import type { FetchError } from "./core/errors.ts";
import { getData, postFormData, postProtobuf } from "./core/http.ts";

export interface ClientOptions {
	needPlainText: boolean;
	needTimestamp: boolean;
	timeFormat: Intl.DateTimeFormat;
}

const defaultOptions: ClientOptions = {
	needPlainText: true,
	needTimestamp: false,
	timeFormat: new Intl.DateTimeFormat("zh-CN", {
		timeStyle: "short",
		dateStyle: "short",
	}),
};

export class TiebaClient {
	readonly bduss: string;
	readonly options: ClientOptions;
	private _tbs?: string;

	constructor(config: { bduss: string; options?: Partial<ClientOptions>; }) {
		this.bduss = config.bduss;
		this.options = { ...defaultOptions, ...config.options };
	}

	/**
	 * 获取 TBS 令牌（懒加载并缓存）。
	 * 所有写操作都需要此令牌。
	 */
	getTbs(): EffectNS.Effect<string, FetchError> {
		if (this._tbs) {
			return Effect.succeed(this._tbs);
		}
		const self = this;
		return Effect.gen(function* () {
			const tbs = yield* getTbs(self);
			self._tbs = tbs;
			return tbs;
		});
	}

	// --- 内部 HTTP 方法（供 API 模块使用） ---

	/** @internal */
	postProtobuf(
		url: string,
		buffer: Uint8Array,
	): EffectNS.Effect<Uint8Array, FetchError> {
		return postProtobuf(url, buffer);
	}

	/** @internal */
	postFormData<T>(url: string, data: string): EffectNS.Effect<T, FetchError> {
		return postFormData<T>(url, data);
	}

	/** @internal */
	getData<T>(url: string): EffectNS.Effect<T, FetchError> {
		return getData<T>(url);
	}

	/** @internal */
	packRequest(
		data: ConstructorParameters<typeof URLSearchParams>[number],
	): string {
		return packRequest(data, this.bduss);
	}

	// --- 用户 API ---

	getUserInfo(username: string) {
		return getUserInfo(this, username);
	}

	getUserByUid(uid: number) {
		return getUserByUid(this, uid);
	}

	getProfile(id: number | string) {
		return getProfile(this, id);
	}

	getPanel(un: string) {
		return getPanel(un);
	}

	getFans(id: number, page?: number | "needAll") {
		return getFans(this, id, page);
	}

	getFollow(id: number, page?: number | "needAll") {
		return getFollow(this, id, page);
	}

	getLikeForum(id: number, page?: number | "needAll") {
		return getLikeForum(this, id, page);
	}

	followUser(portrait: string) {
		return followUser(this, { portrait });
	}

	unfollowUser(portrait: string) {
		return unfollowUser(this, { portrait });
	}

	// --- 帖子/回复 API ---

	getUserPost(uid: number, pn: number | [number, number]) {
		return getUserPost(this, uid, pn);
	}

	getRawUserPost(uid: number, pn: number) {
		return getRawUserPost(this, uid, pn);
	}

	getThreads(params: GetThreadsParams) {
		return getThreads(this, params);
	}

	getPosts(
		tid: number,
		page: number | "ALL",
		options?: Omit<GetPostsParams, "tid" | "page">,
	) {
		return getPosts(this, tid, page, options);
	}

	getComments(params: GetCommentsParams) {
		return getComments(this, params);
	}

	addPost(params: AddPostParams) {
		return addPost(this, params);
	}

	delPost(params: DelPostParams) {
		return delPost(this, params);
	}

	delThread(params: DelThreadParams) {
		return delThread(this, params);
	}

	// --- 贴吧 API ---

	getForumDetail(forumId: number) {
		return getForumDetail(this, forumId);
	}

	getForumName(forumId: number) {
		return getForumName(this, forumId);
	}

	getForumMembers(forumName: string, page: number) {
		return getForumMembers(forumName, page);
	}

	followForum(fid: number) {
		return followForum(this, { fid });
	}

	unfollowForum(fid: number) {
		return unfollowForum(this, { fid });
	}

	signForum(fname: string) {
		return signForum(this, { fname });
	}

	// --- 搜索 API ---

	searchPost(params: Omit<SearchPostParams, never>) {
		return searchPost(this, params);
	}

	searchForum(query: string, pn?: number) {
		return searchForum(this, { query, pn });
	}

	// --- 互动 API ---

	agree(params: AgreeParams) {
		return agree(this, params);
	}

	disagree(tid: number, pid?: number) {
		return disagree(this, tid, pid);
	}

	// --- Moderation APIs ---

	blockUser(params: BlockUserParams) {
		return blockUser(this, params);
	}

	unblockUser(params: UnblockUserParams) {
		return unblockUser(this, params);
	}

	goodThread(params: GoodThreadParams) {
		return goodThread(this, params);
	}

	ungoodThread(params: { fname: string; fid: number; tid: number; }) {
		return ungoodThread(this, params);
	}

	topThread(params: { fname: string; fid: number; tid: number; }) {
		return topThread(this, params);
	}

	untopThread(params: { fname: string; fid: number; tid: number; }) {
		return untopThread(this, params);
	}

	recoverThread(params: { fname: string; fid: number; tid: number; }) {
		return recoverThread(this, params);
	}

	recoverPost(params: { fname: string; fid: number; tid: number; pid: number; }) {
		return recoverPost(this, params);
	}
}
