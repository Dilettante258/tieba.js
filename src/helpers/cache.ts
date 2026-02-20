import { Cache, Duration, Effect } from "effect";
import { getForumName } from "../api/forum.ts";
import type { FetchError } from "../core/errors.ts";
import type { PostInfoList } from "../generated/PostInfoList.ts";

let forumNameCache: Effect.Effect<
	Cache.Cache<string, string, FetchError>,
	never,
	never
> | null = null;

/** 创建吧名缓存，用于批量查询。 */
export function createForumNameCache() {
	if (!forumNameCache) {
		forumNameCache = Cache.make({
			capacity: 500,
			timeToLive: Duration.infinity,
			lookup: (id: string) => getForumName(Number(id)),
		});
	}
	return forumNameCache;
}

/** 展平后的用户发帖记录。 */
export interface UserPost {
	forumId: number;
	forumName: string;
	title: string;
	threadId: string;
	postId: string;
	/** 内容级别的帖子 ID */
	cid: string;
	/** 发帖时间（unix 秒） */
	createTime: number;
	/** 是否是楼中楼回复 */
	affiliated: boolean;
	/** 回复文本内容 */
	content: string;
	/** 楼中楼中回复的目标用户名 */
	replyTo?: string;
}

/**
 * 处理用户发帖原始数据，展平 PostInfoList 为 UserPost[]。
 * @param needForumName 为 true 时通过 getForumName API 解析缺失的吧名
 */
export function processUserPosts(posts: PostInfoList[], needForumName = false) {
	if (!posts?.length) {
		return Effect.succeed([] as UserPost[]);
	}
	return Effect.gen(function* () {
		// 如果需要解析吧名，预热缓存
		let forumCache: Cache.Cache<string, string, FetchError> | undefined;
		if (needForumName) {
			forumCache = yield* createForumNameCache();
			const forumIDList = [...new Set(posts.map((post) => post.forumId))];
			yield* Effect.all(
				forumIDList.map((id) => forumCache!.get(id)),
				{ concurrency: 5 },
			);
		}

		const result: UserPost[] = [];
		for (const post of posts) {
			// 优先使用缓存查到的吧名，否则用 proto 返回的值
			const forumName =
				needForumName && forumCache
					? yield* forumCache.get(post.forumId)
					: post.forumName;

			for (const entry of post.content) {
				const affiliated = entry.postType === "1";
				const isReply =
					affiliated &&
					entry.postContent.length >= 3 &&
					entry.postContent[1]?.type === 4;
				result.push({
					forumId: Number(post.forumId),
					forumName,
					title:
						post.title[0] === "回" && post.title[2] === "："
							? post.title.slice(3)
							: post.title,
					threadId: post.threadId,
					postId: post.postId,
					cid: entry.postId,
					createTime: Number(entry.createTime),
					affiliated,
					content: isReply
						? (entry.postContent[2]?.text ?? "").slice(2)
						: entry.postContent.length === 1
							? (entry.postContent[0]?.text ?? "")
							: entry.postContent.map((item) => item.text).join(""),
					replyTo: isReply ? entry.postContent[1]?.text : undefined,
				});
			}
		}
		return result;
	});
}
