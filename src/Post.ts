import { Effect, Either, pipe, Schedule } from "effect";
import {
	type postReq,
	postReqSerialize,
	postResDeserialize,
} from "./ProtobufParser.js";
import type { PostList, PostRes, UserList } from "./types/Post.js";
import {
	checkResBuffer,
	type FetchError,
	postProtobuf,
} from "./utils/index.js";

const maxPage = 600;

function getPostPipeline(params: postReq) {
	return pipe(
		postReqSerialize(params),
		(buffer) => postProtobuf("/c/f/pb/page?cmd=303002", buffer),
		Effect.andThen((buffer) => {
			checkResBuffer(buffer);
			return Effect.succeed(postResDeserialize(buffer) as PostRes);
		}),
	);
}

export function getPost(
	tid: number,
	page: number | "ALL",
	onlyThreadAuthor?: boolean,
	withComment?: boolean,
	commentParams?: {
		commentRn: number;
		commentsSortByTime: boolean;
	},
): Effect.Effect<PostRes, FetchError> {
	const func = (pg: number): Effect.Effect<PostRes, FetchError> => {
		if (onlyThreadAuthor === undefined) {
			return getPostPipeline({ tid, page: pg });
		}
		if (withComment === false) {
			return getPostPipeline({ tid, page: pg, onlyThreadAuthor });
		}
		return getPostPipeline({
			tid,
			page: pg,
			withComment,
			...(commentParams || {}),
			onlyThreadAuthor,
		}).pipe(
			Effect.retry({
				schedule: Schedule.exponential(1000),
				times: 3,
			}),
		);
	};

	if (page === "ALL") {
		return Effect.gen(function* () {
			const page1 = yield* func(1);
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
				const promises: Array<Effect.Effect<PostRes, FetchError>> = [];
				for (
					let i = b * batchSize + 2;
					i <= (b + 1) * batchSize && i <= totalPage;
					i++
				) {
					promises.push(func(i));
				}

				const results = yield* Effect.all(promises, {
					concurrency: 5,
					mode: "either",
				});
				const successResults = results.filter((item) => Either.isRight(item));
				const batchPosts = successResults
					.map((item) => item.right.postList)
					.reduce((acc, val) => acc.concat(val), []);
				const batchUsers = successResults
					.map((item) => item.right.userList)
					.reduce((acc, val) => acc.concat(val), []);
				allPosts.push(...batchPosts);
				allUsers.push(...batchUsers);

				if (b < batch - 1) {
					yield* Effect.sleep(1000);
				}
			}

			page1.postList.push(...allPosts);
			page1.userList.push(...allUsers);
			return page1;
		});
	}

	return func(page);
}
