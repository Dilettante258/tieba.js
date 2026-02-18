// 贴吧 API
export {
	type ForumMemberData,
	type ForumMemberPageData,
	type ForumMemberRes,
	followForum,
	type GetThreadsParams,
	getForumDetail,
	getForumMembers,
	getForumName,
	getThreads,
	signForum,
	unfollowForum,
} from "./forum.ts";
// 互动 API
export {
	type AgreeParams,
	agree,
	disagree,
} from "./interaction.ts";
// 管理 API
export {
	type BlockUserParams,
	blockUser,
	type GoodThreadParams,
	goodThread,
	recoverPost,
	recoverThread,
	topThread,
	type UnblockUserParams,
	unblockUser,
	ungoodThread,
	untopThread,
} from "./moderation.ts";
// 帖子 API
export {
	type AddPostParams,
	addPost,
	type DelPostParams,
	type DelThreadParams,
	delPost,
	delThread,
	type GetCommentsParams,
	type GetPostsParams,
	getComments,
	getPosts,
	getRawUserPost,
	getUserPost,
} from "./post.ts";
// 搜索 API
export {
	type SearchForumResult,
	type SearchPostParams,
	type SearchPostResult,
	searchForum,
	searchPost,
} from "./search.ts";
// 用户 API
export {
	type FanRes,
	type FollowRes,
	followUser,
	getFans,
	getFollow,
	getHiddenLikeForum,
	getLikeForum,
	getPanel,
	getProfile,
	getUserByUid,
	getUserInfo,
	type HiddenLikeForum,
	type LikeForum,
	type UserInfo,
	type UserPanel,
	unfollowUser,
} from "./user.ts";
