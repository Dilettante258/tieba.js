import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
	getUserInfo,
	getUserByUid,
	getProfile,
	getPanel,
	getLikeForum,
	getFans,
	getFollow,
} from "../../src/api/user.ts";
import { safeRun, TEST_PARAMS } from "./setup.ts";

describe("User APIs", () => {
	test("getUserInfo — 返回用户数据", async () => {
		const data: any = await Effect.runPromise(
			getUserInfo(TEST_PARAMS.username),
		);
		expect(data.id).toBeDefined();
	});

	test("getUserByUid — 返回用户信息", async () => {
		const data = await safeRun(getUserByUid(TEST_PARAMS.tiebaUid));
		if (!data) return;
		expect(data.name).toBeDefined();
		expect(data.id).toBeDefined();
	});

	test("getProfile — 通过数字 ID 查询", async () => {
		const data = await safeRun(getProfile(TEST_PARAMS.userId));
		if (!data) return;
		expect(data).toBeDefined();
		if (data.user) {
			expect(data.user.name).toBeDefined();
		}
	});

	test("getProfile — 通过 portrait 查询", async () => {
		const data = await safeRun(getProfile(TEST_PARAMS.portrait));
		if (!data) return;
		expect(data).toBeDefined();
		if (data.user) {
			expect(data.user.name).toBeDefined();
		}
	});

	test("getPanel — 返回面板数据", async () => {
		const data = await safeRun(getPanel(TEST_PARAMS.panelUn));
		if (!data) return;
		expect(data).toBeDefined();
	});

	test("getLikeForum — 返回关注的吧列表", async () => {
		const data = await Effect.runPromise(getLikeForum(TEST_PARAMS.userId));
		expect(data).toBeInstanceOf(Array);
		expect(data.length).toBeGreaterThan(0);
		const first = data[0];
		expect(first.id).toBeDefined();
		expect(first.name).toBeDefined();
	});

	test("getFans — 返回粉丝列表和分页", async () => {
		const data = await Effect.runPromise(getFans(TEST_PARAMS.userId, 1));
		expect(data.user_list).toBeInstanceOf(Array);
		expect(data.user_list.length).toBeGreaterThan(0);
		expect(data.page.total_page).toBeDefined();
	});

	test("getFollow — 返回关注列表", async () => {
		const data = await Effect.runPromise(getFollow(TEST_PARAMS.userId, 1));
		expect(data.follow_list).toBeInstanceOf(Array);
		expect(data.total_follow_num).toBeDefined();
	});
});
