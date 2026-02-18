// 核心

// API 类型
export type {
	AddPostParams,
	AgreeParams,
	BlockUserParams,
	DelPostParams,
	DelThreadParams,
	FanRes,
	FollowRes,
	ForumMemberData,
	ForumMemberPageData,
	ForumMemberRes,
	GetCommentsParams,
	GetPostsParams,
	GetThreadsParams,
	GoodThreadParams,
	HiddenLikeForum,
	LikeForum,
	SearchForumResult,
	SearchPostParams,
	SearchPostResult,
	UnblockUserParams,
	UserInfo,
	UserPanel,
} from "./api/index.ts";
// API — 读操作
// API — 写操作
export {
	addPost,
	agree,
	blockUser,
	delPost,
	delThread,
	disagree,
	followForum,
	followUser,
	getComments,
	getFans,
	getFollow,
	getForumDetail,
	getForumMembers,
	getForumName,
	getHiddenLikeForum,
	getLikeForum,
	getPanel,
	getPosts,
	getProfile,
	getRawUserPost,
	getThreads,
	getUserByUid,
	getUserInfo,
	getUserPost,
	goodThread,
	recoverPost,
	recoverThread,
	searchForum,
	searchPost,
	signForum,
	topThread,
	unblockUser,
	unfollowForum,
	unfollowUser,
	ungoodThread,
	untopThread,
} from "./api/index.ts";
export { type ClientOptions, TiebaClient } from "./client.ts";
export { getClient, initClient } from "./context.ts";
export { consume, consumeAll, consumeAllSuccess } from "./core/effect.ts";
export {
	FetchError,
	InvalidParamError,
	NotFoundError,
	ParseError,
	TiebaError,
	TiebaServerError,
} from "./core/errors.ts";
export { type UserPost, processUserPosts } from "./helpers/cache.ts";
export { MethodEnum, UserIdResolver } from "./helpers/user-id-resolver.ts";
