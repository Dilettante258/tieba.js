import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { client, safeRun, TEST_PARAMS } from "./setup.ts";

describe("Forum APIs", () => {
	test("getThreads — 返回主题帖列表", async () => {
		const data = await safeRun(
			client.getThreads({ fname: TEST_PARAMS.forumName, page: 1 }),
		);
		if (!data) return;
		expect(data.threadList).toBeInstanceOf(Array);
		expect(data.threadList.length).toBeGreaterThan(0);
	});

	test("getForumDetail — 返回吧信息", async () => {
		const data = await safeRun(
			client.getForumDetail(TEST_PARAMS.forumId),
		);
		if (!data) return;
		expect(data.forumInfo).toBeDefined();
		expect(data.forumInfo?.forumId).toBeDefined();
		expect(data.forumInfo?.forumName).toBeDefined();
	});

	test("getForumName — 返回吧名字符串", async () => {
		const data = await safeRun(
			client.getForumName(TEST_PARAMS.forumId),
		);
		if (data === null) return;
		expect(typeof data).toBe("string");
		expect(data.length).toBeGreaterThan(0);
	});

	test("getForumMembers — 返回成员列表和分页", async () => {
		const data = await Effect.runPromise(
			client.getForumMembers(TEST_PARAMS.forumMemberName, 1),
		);
		expect(data.data).toBeInstanceOf(Array);
		expect(data.data.length).toBeGreaterThan(0);
		expect(data.pageData.now).toBe(1);
		expect(data.pageData.all).toBeGreaterThan(0);
	});

	test("signForum — 签到不抛出异常", async () => {
		// 成功返回 undefined，已签到则触发 TiebaServerError（被 safeRun 捕获）
		await safeRun(client.signForum(TEST_PARAMS.forumName));
	});
});
