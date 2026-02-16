import { Effect } from "effect";
import type { ParseError } from "../core/errors.ts";
import { processContent } from "./content.ts";

interface PostListItem {
	content: Array<{ type: number; text?: string; c?: string; cdnSrc?: string }>;
	signature?: {
		content: Array<{
			type: number;
			text?: string;
			c?: string;
			cdnSrc?: string;
		}>;
	};
	agree: { agreeNum: number; disagreeNum: number };
	subPostList?: { subPostList: SubPostItem[] };
	subPostNumber: number;
}

interface SubPostItem {
	id: string;
	time: string;
	authorId: string;
	content: Array<{
		type: number;
		text?: string;
		uid?: string;
	}>;
}

export interface OutputPostList {
	content: string;
	signature?: string;
	agree: { agreeNum: number; disagreeNum: number };
	subPostList?: Array<{
		id: string;
		time: string;
		authorId: string;
		content: string;
		otherName?: string;
		otherId?: string;
	}>;
}

function processSubPost(subPost: SubPostItem, needPlainText: boolean) {
	const isReply =
		subPost.content.length >= 3 && subPost.content[1]?.uid !== undefined;

	const contentEffect = isReply
		? processContent(subPost.content.slice(2), needPlainText).pipe(
				Effect.map((c) => c.substring(2)),
			)
		: processContent(subPost.content, needPlainText);

	return Effect.map(contentEffect, (content) => ({
		id: subPost.id,
		time: subPost.time,
		authorId: subPost.authorId,
		content,
		...(isReply
			? {
					otherName: subPost.content[1]?.text,
					otherId: subPost.content[1]?.uid,
				}
			: {}),
	}));
}

/** 将原始帖子数据整理为结构化输出格式。 */
export function collatePost(
	posts: PostListItem[],
	withComment = true,
	needPlainText = true,
): Effect.Effect<OutputPostList[], ParseError> {
	return Effect.gen(function* () {
		const result: OutputPostList[] = [];
		for (const post of posts) {
			const content = yield* processContent(post.content, needPlainText);
			const signature = post?.signature
				? yield* processContent(post.signature.content, needPlainText)
				: undefined;

			let subPostList: OutputPostList["subPostList"];
			if (withComment && post.subPostList && post.subPostNumber > 0) {
				subPostList = yield* Effect.all(
					post.subPostList.subPostList.map((sub) =>
						processSubPost(sub, needPlainText),
					),
				);
			}

			result.push({
				...post,
				agree: {
					agreeNum: post.agree.agreeNum,
					disagreeNum: post.agree.disagreeNum,
				},
				signature,
				subPostList,
				content,
			});
		}
		return result;
	});
}
