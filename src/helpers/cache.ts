import { Cache, Duration, Effect } from "effect";
import { getForumName } from "../api/forum.ts";
import type { TiebaClient } from "../client.ts";
import type { FetchError } from "../core/errors.ts";

let forumNameCache: Effect.Effect<
	Cache.Cache<string, string, FetchError>,
	never,
	never
> | null = null;

/** 创建吧名缓存，用于批量查询。 */
export function createForumNameCache(client: TiebaClient) {
	if (!forumNameCache) {
		forumNameCache = Cache.make({
			capacity: 200,
			timeToLive: Duration.infinity,
			lookup: (id: string) => getForumName(client, Number(id)),
		});
	}
	return forumNameCache;
}

/** 处理用户发帖原始数据，可选解析吧名。 */
export function processUserPosts(
	client: TiebaClient,
	posts: Array<{
		forumId: string;
		title: string;
		threadId: string;
		postId: string;
		content: Array<{
			postType: string;
			postId: string;
			createTime: string;
			postContent: Array<{ type?: number; text: string; uid?: string }>;
		}>;
	}>,
	needForumName = false,
	options: {
		needTimestamp: boolean;
		timeFormat: Intl.DateTimeFormat;
	} = {
		needTimestamp: false,
		timeFormat: new Intl.DateTimeFormat("zh-CN", {
			timeStyle: "short",
			dateStyle: "short",
		}),
	},
) {
	if (posts === undefined) {
		return Effect.succeed([]);
	}
	return Effect.gen(function* () {
		const result: Array<{
			forumId: number;
			forumName: string;
			title: string;
			threadId: string;
			postId: string;
			cid: string;
			createTime: string;
			affiliated: boolean;
			content: string;
			replyTo?: string;
		}> = [];

		if (needForumName) {
			const forumCache = yield* createForumNameCache(client);

			const forumIDList = [...new Set(posts.map((post) => post.forumId))];
			yield* Effect.all(
				forumIDList.map((id) => forumCache.get(id)),
				{ concurrency: 5 },
			);

			for (const post of posts) {
				const forumName_ = (yield* forumCache.get(post.forumId)) as string;
				for (const content of post.content) {
					const affiliated = content.postType === "1";
					const isReply = affiliated && content?.postContent[1]?.type === 4;
					result.push({
						forumId: Number(post.forumId),
						forumName: forumName_,
						title: post.title.slice(3),
						threadId: post.threadId,
						postId: post.postId,
						cid: content.postId,
						createTime: options.needTimestamp
							? content.createTime
							: options.timeFormat.format(
									new Date(Number(content.createTime) * 1000),
								),
						affiliated,
						content: isReply
							? content.postContent[2].text.slice(2)
							: content.postContent.length === 1
								? content.postContent[0].text
								: content.postContent.map((item) => item.text).join(""),
						replyTo: isReply ? content.postContent[1].text : undefined,
					});
				}
			}
		}
		return result;
	});
}
