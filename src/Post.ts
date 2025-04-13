import {type postReq, postReqSerialize, postResDeserialize,} from "./ProtobufParser.js";
import type {PostList, PostRes, UserList} from "./types/Post.js";
import {postProtobuf} from "./utils/index.js";

const maxPage = 600;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPostPipeline(params: postReq) {
	const buffer = postReqSerialize(params);
	const responseData = await postProtobuf("/c/f/pb/page?cmd=303002", buffer);
	return postResDeserialize(responseData);
}

export async function getPost(
	tid: number,
	page: number | "ALL",
): Promise<PostRes>;
export async function getPost(
	tid: number,
	page: number | "ALL",
	onlyThreadAuthor: boolean,
	withComment: boolean,
): Promise<PostRes>;
export async function getPost(
	tid: number,
	page: number | "ALL",
	onlyThreadAuthor: boolean,
	withComment: boolean,
	commentParams: {
		commentRn: number;
		commentsSortByTime: boolean;
	},
): Promise<PostRes>;

export async function getPost(
	tid: number,
	page: number | "ALL",
	onlyThreadAuthor?: boolean,
	withComment?: boolean,
	commentParams?: {
		commentRn: number;
		commentsSortByTime: boolean;
	},
): Promise<PostRes> {
	const func = async (pg: number) => {
		if (onlyThreadAuthor === undefined) {
			return await getPostPipeline({ tid, page: pg });
		}
		if (withComment === false) {
			return await getPostPipeline({ tid, page: pg, onlyThreadAuthor });
		}
		return await getPostPipeline({
			tid,
			page: pg,
			withComment,
			...(commentParams || {}),
			onlyThreadAuthor,
		});
	};
	if (page === "ALL") {
		const page1 = await func(1);
		const totalPage = Math.min(page1?.page?.totalPage, Number(maxPage));
		let batch = 1;
		if (totalPage > 30 && totalPage <= 100) batch = 4;
		if (totalPage > 100) batch = 6;
		if (totalPage > 300) batch = 8;
		if (totalPage > 500) batch = 12;
		const batchSize = Math.ceil(totalPage / batch);

		const allPosts: Array<PostList> = [];
		const allUsers: Array<UserList> = [];
		for (let b = 0; b < batch; b++) {
			const promises: Array<Promise<any>> = [];
			for (
				let i = b * batchSize + 2;
				i <= (b + 1) * batchSize && i <= totalPage;
				i++
			) {
				promises.push(func(i));
			}
			let results = await Promise.allSettled(promises);
			const data = results
				.filter((item) => item.status === "fulfilled")
				.flatMap((item: PromiseFulfilledResult<PostRes>) => item.value);
			const batchPosts = data
				.map((item) => item.postList)
				.reduce((acc, val) => acc.concat(val), []);
			const batchUsers = data
				.map((item) => item.userList)
				.reduce((acc, val) => acc.concat(val), []);
			allPosts.push(...batchPosts);
			allUsers.push(...batchUsers);
			if (b < batch - 1) await delay(1000);
		}
		page1.postList.push(...allPosts);
		page1.userList.push(...allUsers);
		return page1;
	}
	return await func(page);
}
