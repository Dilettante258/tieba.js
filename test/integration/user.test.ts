import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { client, safeRun, TEST_PARAMS } from "./setup.ts";

describe("User APIs", () => {
	test("getUserInfo — 返回用户数据", async () => {
		const data: any = await Effect.runPromise(
			client.getUserInfo(TEST_PARAMS.username),
		);
		expect(data.id).toBeDefined();
	});

	test("getUserByUid — 返回用户信息", async () => {
		const data = await safeRun(
			client.getUserByUid(TEST_PARAMS.tiebaUid),
		);
		if (!data) return;
		expect(data.name).toBeDefined();
		expect(data.id).toBeDefined();
	});

	test("getProfile — 通过数字 ID 查询", async () => {
		const data = await safeRun(
			client.getProfile(TEST_PARAMS.userId),
		);
		if (!data) return;
		expect(data).toBeDefined();
		if (data.user) {
			expect(data.user.name).toBeDefined();
		}
	});

	test("getProfile — 通过 portrait 查询", async () => {
		const data = await safeRun(
			client.getProfile(TEST_PARAMS.portrait),
		);
		if (!data) return;
		expect(data).toBeDefined();
		if (data.user) {
			expect(data.user.name).toBeDefined();
		}
	});

	test("getPanel — 返回面板数据", async () => {
		const data: any = await Effect.runPromise(
			client.getPanel(TEST_PARAMS.panelUn),
		);
		expect(data.no).toBe(0);
		expect(data.data?.name).toBe(TEST_PARAMS.panelUn);
	});

	test("getLikeForum — 返回关注的吧列表", async () => {
		const data = await Effect.runPromise(
			client.getLikeForum(TEST_PARAMS.userId),
		);
		expect(data).toBeInstanceOf(Array);
		expect(data.length).toBeGreaterThan(0);
		const first: any = data[0];
		expect(first.id ?? first.forum_id).toBeDefined();
		expect(first.name ?? first.forum_name).toBeDefined();
	});

	test("getFans — 返回粉丝列表和分页", async () => {
		const data = await Effect.runPromise(
			client.getFans(TEST_PARAMS.userId, 1),
		);
		expect(data.user_list).toBeInstanceOf(Array);
		expect(data.user_list.length).toBeGreaterThan(0);
		expect(data.page.total_page).toBeDefined();
	});

	test("getFollow — 返回关注列表", async () => {
		const data = await Effect.runPromise(
			client.getFollow(TEST_PARAMS.userId, 1),
		);
		expect(data.follow_list).toBeInstanceOf(Array);
		expect(data.total_follow_num).toBeDefined();
	});
});
