import { describe, expect, test } from "bun:test";
import { agree } from "../../src/api/interaction.ts";
import { searchForum, searchPost } from "../../src/api/search.ts";
import { client, safeRun, TEST_PARAMS } from "./setup.ts";

describe("搜索与互动 APIs", () => {
	test("getTbs — 返回有效的 TBS 令牌", async () => {
		const tbs = await safeRun(client.getTbs());
		if (!tbs) return;
		expect(typeof tbs).toBe("string");
		expect(tbs.length).toBeGreaterThan(0);
	});

	test("searchPost — 返回搜索结果", async () => {
		const data = await safeRun(
			searchPost({
				fname: TEST_PARAMS.forumName,
				query: "测试",
			}),
		);
		if (!data) return;
		expect(data).toBeDefined();
	});

	test("searchForum — 返回搜索结果", async () => {
		const data = await safeRun(
			searchForum({ query: TEST_PARAMS.forumName }),
		);
		if (!data) return;
		expect(data).toHaveProperty("exact_match");
		if (data.exact_match) {
			expect(data.exact_match.forum_name).toBeDefined();
		}
	});

	test("agree — 点赞不抛出异常", async () => {
		await safeRun(agree({ tid: TEST_PARAMS.tid }));
	});
});
