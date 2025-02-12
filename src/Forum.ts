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
	fetchWithRetry,
	postProtobuf,
	processThread,
} from "./utils/index.js";

async function threadPipeline(params: threadReq): Promise<ForumThreadRes> {
	const buffer = threadReqSerialize(params);
	const responseData = await postProtobuf("/c/f/frs/page?cmd=303002", buffer);
	return threadResDeserialize(responseData);
}

export async function getRawThread(params: threadReq) {
	return await threadPipeline(params);
}

export async function getThread(params: threadReq) {
	const threads = await threadPipeline(params);
	threads.threadList = threads.threadList.map(processThread);
	return threads;
}

export async function getThreadPid(
	params: threadReq,
): Promise<{ page: ForumThreadPage; pidList: Array<string> }> {
	const result = await threadPipeline(params);
	if (result?.threadList === undefined) {
		return { page: result.page, pidList: [] };
	}
	const pidList = result.threadList.map((item) => item.id);
	return {
		page: result.page,
		pidList,
	};
}

export async function getForumInfoByID(forumId: number) {
	const buffer = forumReqSerialize(forumId);
	const res = await postProtobuf(
		"/c/f/forum/getforumdetail?cmd=303021",
		buffer,
	);
	if (res.byteLength < 200) {
		console.error(`Error: 未查询到吧信息，吧ID：${forumId}`);
		return "!!!Error!!!";
	}
	return forumResDeserialize(res);
}

export async function getForumID(forumName: string): Promise<number> {
	const res = await fetch(
		`https://tiebac.baidu.com/f/commit/share/fnameShareApi?fname=${forumName}&ie=utf-8`,
	).then((response) => response.json());
	if (!res) {
		console.error(`Error: 未查询到吧信息，吧ID：${forumName}`);
		return 0;
	}
	return res.data.fid as number;
}

export async function getForumMembers(
	forumName: string,
	page: number,
): Promise<ForumMemberRes> {
	if (page > 500 || page < 1) {
		throw new Error("超出合法页面范围，最大允许 500 页");
	}

	const url = new URL("/bawu2/platform/listMemberInfo", baseUrl);
	const fetchFunction = () =>
		fetch(url).then((response) => response.arrayBuffer());
	url.searchParams.append("word", forumName);
	url.searchParams.append("pn", page.toString());
	url.searchParams.append("ie", "utf-8");
	const res = await fetchWithRetry(fetchFunction);
	const decoder = new TextDecoder("gbk");
	const resText = decoder.decode(res);
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
	const forumData = await JSON.parse(
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
	return { data, pageData };
}
