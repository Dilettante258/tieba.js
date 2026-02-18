import { describe, expect, test } from "bun:test";
import {
	getPosts,
	getComments,
	getUserPost,
	getRawUserPost,
} from "../../src/api/post.ts";
import { safeRun, TEST_PARAMS } from "./setup.ts";

describe("Post APIs", () => {
	test("getPosts — 返回帖子列表和分页", async () => {
		const data = await safeRun(getPosts(TEST_PARAMS.tid, 1));
		if (!data) return;
		expect(data.postList).toBeInstanceOf(Array);
		expect(data.postList.length).toBeGreaterThan(0);
		expect(Number(data.page?.totalPage)).toBeGreaterThan(0);

		const post = data.postList[0];
		expect(post).toHaveProperty("id");
		expect(post).toHaveProperty("content");
		expect(post).toHaveProperty("agree");
	});

	test("getPosts — 含楼中楼", async () => {
		const data = await safeRun(
			getPosts(TEST_PARAMS.tid, 1, { withComment: true }),
		);
		if (!data) return;
		expect(data.postList.length).toBeGreaterThan(0);
		for (const post of data.postList) {
			expect(post).toHaveProperty("subPostNumber");
		}
	});

	test("getComments — 返回楼中楼列表", async () => {
		// 先获取帖子，找到有楼中楼的帖子
		const posts = await safeRun(getPosts(TEST_PARAMS.tid, 1));
		if (!posts?.postList?.length) return;

		const target = posts.postList.find((p) => p.subPostNumber > 0);
		if (!target) return;

		const data = await safeRun(
			getComments({
				tid: TEST_PARAMS.tid,
				pid: Number(target.id),
			}),
		);
		if (!data) return;
		expect(data.subpostList).toBeInstanceOf(Array);
	});

	test("getUserPost — 返回用户帖子数组", async () => {
		const data = await safeRun(
			getUserPost(TEST_PARAMS.userId, 1),
		);
		if (!data) return;
		expect(data).toBeInstanceOf(Array);
	});

	test("getRawUserPost — 返回原始用户帖子数组", async () => {
		const data = await safeRun(
			getRawUserPost(TEST_PARAMS.userId, 1),
		);
		if (!data) return;
		expect(data).toBeInstanceOf(Array);
	});
});
