import {
	userPostReqSerialize,
	userPostResDeserialize,
} from "./ProtobufParser.js";
import type { RawUserPost, UserPost } from "./types/UserPost.js";
import { postProtobuf, processUserPosts } from "./utils/index.js";

const UPAPI = "/c/u/feed/userpost?cmd=303002";

async function pipeline(uid: number, pn: number) {
	const buffer = userPostReqSerialize(uid, pn);
	const responseData = await postProtobuf(UPAPI, buffer);
	if (responseData.byteLength < 200) {
		console.error("Fetch failed");
	}
	return userPostResDeserialize(responseData);
}

export async function getRawUserPost(
	uid: number,
	pn: number,
): Promise<RawUserPost[]> {
	return await pipeline(uid, pn);
}

export async function getUserPost(
	uid: number,
	pn: number,
	needForumName?: boolean,
): Promise<UserPost[]>;
export async function getUserPost(
	uid: number,
	pageRange: [number, number],
	needForumName?: boolean,
): Promise<UserPost[]>;

export async function getUserPost(
	uid: number,
	param2: number | [number, number],
	needForumName?: boolean,
): Promise<UserPost[]> {
	if (typeof param2 === "number") {
		const RawUserPost = await getRawUserPost(uid, param2);
		return await processUserPosts(RawUserPost, needForumName);
	}
	const buffers: Buffer[] = [];
	for (let i = param2[0]; i <= param2[1]; i++) {
		buffers.push(userPostReqSerialize(uid, i));
	}
	const RawUserPost = await Promise.all(
		buffers.map((buffer) =>
			postProtobuf("/c/u/feed/userpost?cmd=303002", buffer),
		),
	)
		.then((res) => {
			return Promise.all(
				res.map(async (res) => {
					return userPostResDeserialize(res);
				}),
			);
		})
		.then((results) => {
			return results.flat();
		});
	return await processUserPosts(RawUserPost, needForumName);
}
