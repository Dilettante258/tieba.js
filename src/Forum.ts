import { Effect, pipe, Schedule } from "effect";
import HTMLParser from "node-html-parser";
import {
	forumReqSerialize,
	forumResDeserialize,
	type threadReq,
	threadReqSerialize,
	threadResDeserialize,
} from "./ProtobufParser.js";
import type {
	ForumMemberRes,
	ForumThreadPage,
	ForumThreadRes,
} from "./types/Forum.js";
import {
	baseUrl,
	checkResBuffer,
	FetchError,
	IllegalParameterError,
	postProtobuf,
	processThread,
	requestWithRetry,
} from "./utils/index.js";

function threadPipeline(params: threadReq) {
	return pipe(
		threadReqSerialize(params),
		(buffer) => postProtobuf("/c/f/frs/page?cmd=303002", buffer),
		Effect.andThen((buffer) => {
			checkResBuffer(buffer);
			return Effect.succeed(threadResDeserialize(buffer) as ForumThreadRes);
		}),
	);
}

export function getRawThread(params: threadReq) {
	return threadPipeline(params);
}

export function getThread(params: threadReq) {
	return pipe(
		threadPipeline(params),
		Effect.flatMap((threadsData) => {
			const processedThreadList = Effect.all(
				threadsData.threadList.map(processThread),
			);
			return pipe(
				processedThreadList,
				Effect.map(
					(processedThreads) =>
						({
							...threadsData,
							threadList: processedThreads,
						}) as unknown as ForumThreadRes,
				),
			);
		}),
	);
}

export function getThreadPid(
	params: threadReq,
): Effect.Effect<
	{ page: ForumThreadPage; pidList: Array<string> },
	FetchError
> {
	return pipe(
		threadPipeline(params),
		Effect.map((result) => {
			if (result?.threadList === undefined) {
				return { page: result.page, pidList: [] };
			}
			const pidList = result.threadList.map((item) => item.id);
			return {
				page: result.page as ForumThreadPage,
				pidList: pidList as Array<string>,
			};
		}),
	);
}

export function getForumInfoByID(forumId: number) {
	return pipe(
		forumReqSerialize(forumId),
		(buffer) => postProtobuf("/c/f/forum/getforumdetail?cmd=303021", buffer),
		Effect.andThen((buffer) => {
			checkResBuffer(buffer);
			return Effect.succeed(forumResDeserialize(buffer));
		}),
	);
}

export function getForumID(forumName: string) {
	return pipe(
		requestWithRetry(
			`https://tiebac.baidu.com/f/commit/share/fnameShareApi?fname=${forumName}&ie=utf-8`,
			{
				method: "GET",
			},
			"json",
		),
		Effect.andThen((res) => {
			if (!res) {
				throw new FetchError(`Error: 未查询到吧信息，吧ID：${forumName}`);
			}
			return res.data.fid as number;
		}),
	);
}
import { request } from "undici";

export function getForumMembers(forumName: string, page: number) {
	if (page > 500 || page < 1) {
		throw new IllegalParameterError("超出合法页面范围，最大允许 500 页");
	}

	return Effect.gen(function* () {
		const url = new URL("/bawu2/platform/listMemberInfo", baseUrl);
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
		const data = doc.querySelectorAll("a.user_name").map((element) => {
			return {
				portrait: element.attributes.href.slice(14),
				username: element.attributes.title,
				nickname: element.innerText,
			};
		});

		const forumDataText = doc.querySelector("body > div.wrap1 > div > script")
			?.innerText as string;
		const forumData = JSON.parse(
			forumDataText.slice(43, forumDataText.indexOf(";PageData.user.balv")),
		);
		const pageNow = Number.parseInt(
			doc.querySelector(
				"#container > div.tbui_pagination.tbui_pagination_left > ul > li.active > span",
			)?.innerText as string,
		);
		const pageData = {
			all: Number.parseInt(
				doc
					.querySelector("span.tbui_total_page")
					?.innerText.slice(1, -1) as string,
			),
			now: pageNow,
			membersNum: forumData.member_num,
			forumId: forumData.forum_id,
			forumName: forumData.forum_name,
		};
		return { data, pageData } satisfies ForumMemberRes;
	});
}
