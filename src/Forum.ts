import {
	forumReqSerialize,
	forumResDeserialize,
	type threadReq,
	threadReqSerialize,
	threadResDeserialize,
} from "./ProtobufParser";
import type {ForumThreadPage, ForumThreadRes} from "./types";
import {postProtobuf, processThread} from "./utils";

async function threadPipeline(params: threadReq): Promise<ForumThreadRes> {
	const buffer = await threadReqSerialize(params);
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
	const pidList = result.threadList.map((item) => item.id);
	return {
		page: result.page,
		pidList,
	};
}

const forumNameCache = {};

export async function getForumName(forumId: number) {
	if (forumNameCache[forumId]) {
		return forumNameCache[forumId];
	}
	const buffer = await forumReqSerialize(forumId);
	const res = await postProtobuf(
		"/c/f/forum/getforumdetail?cmd=303021",
		buffer,
	);
	if (res.byteLength < 200) {
		console.error("Error: 未找到吧！");
		return "error";
	}
	const forumName = await forumResDeserialize(res);
	forumNameCache[forumId] = forumName;
	return forumName;
}

export async function getForumInfoByID(forumId: number) {
	const buffer = await forumReqSerialize(forumId);
	const res = await postProtobuf(
		"/c/f/forum/getforumdetail?cmd=303021",
		buffer,
	);
	if (res.byteLength < 200) {
		console.error("Error: 未查询到吧信息，吧ID：" + forumId);
		return "!!!Error!!!";
	}
	return await forumResDeserialize(res);
}
