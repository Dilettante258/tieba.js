import { beforeAll, expect } from "bun:test";
import { Effect } from "effect";
import { TiebaClient } from "../../src/client.ts";
import { initClient } from "../../src/context.ts";
import { TiebaServerError } from "../../src/core/errors.ts";

/** 全局共享的测试客户端，在 beforeAll 中初始化 */
export let client: TiebaClient;

beforeAll(() => {
	const bduss = process.env.BDUSS!;
	expect(bduss).toBeDefined();
	client = new TiebaClient({ bduss });
	initClient(client);
});

/**
 * 安全执行 Effect，遇到服务端业务错误时返回 null。
 * 贴吧 proto 接口可能返回各种业务错误码（210009、350004 等），
 * Effect 会将 TiebaServerError 包装为 FiberFailure。
 * 集成测试中用 null 表示「服务端异常，跳过断言」。
 */
export async function safeRun<T>(
	effect: Effect.Effect<T, any>,
): Promise<T | null> {
	try {
		return await Effect.runPromise(effect);
	} catch (e: unknown) {
		if (
			e instanceof TiebaServerError ||
			(e instanceof Error && e.message.includes("Tieba API error"))
		) {
			return null;
		}
		throw e;
	}
}

/** 集成测试用的固定参数 */
export const TEST_PARAMS = {
	// 用户
	username: "老葡秋",
	tiebaUid: 30861022,
	userId: 5991323492,
	portrait: "tb.1.5cbeff48.BFTm1j0MhGcFt-QXdcexQw",
	panelUn: "Admire_02",

	// 贴吧
	forumName: "嘉然",
	forumId: 97650,
	forumMemberName: "嘉然",

	// 帖子
	tid: 8512477747,
} as const;
