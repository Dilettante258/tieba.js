import { Effect, pipe } from "effect";
import {
	userPostReqSerialize,
	userPostResDeserialize,
} from "./ProtobufParser.js";
import type { RawUserPost } from "./types/UserPost.js";
import {
	checkResBuffer,
	postProtobuf,
	processUserPosts,
} from "./utils/index.js";

const UPAPI = "/c/u/feed/userpost?cmd=303002";

function getUPpipeline(uid: number, pn: number) {
	return pipe(
		userPostReqSerialize(uid, pn),
		(buffer) => postProtobuf(UPAPI, buffer),
		Effect.andThen((responseData) => {
			checkResBuffer(responseData);
			return Effect.succeed(
				userPostResDeserialize(responseData) as RawUserPost[],
			);
		}),
	);
}

export function getRawUserPost(uid: number, pn: number) {
	return getUPpipeline(uid, pn);
}

export function getUserPost(
	uid: number,
	param2: number | [number, number],
	needForumName?: boolean,
) {
	if (typeof param2 === "number") {
		return pipe(
			getUPpipeline(uid, param2),
			Effect.andThen((rawPosts) =>
				processUserPosts(rawPosts, needForumName),
			),
      Effect.andThen((posts) => Effect.succeed(posts)),
		);
	}
	const [start, end] = param2;
	const effects = Array.from(
		{ length: end - start + 1 },
		(_, i) => start + i,
	).map((page) =>
		pipe(
			getUPpipeline(uid, page),
			Effect.andThen((rawPosts) => processUserPosts(rawPosts, needForumName)
				
			),
			Effect.andThen((posts) => Effect.succeed(posts)),
		),
	);
	return Effect.all(effects).pipe(
		Effect.andThen((posts) => Effect.succeed(posts.flat())),
	);
}
