import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { consume, consumeAll, consumeAllSuccess } from "../src/core/effect.ts";
import { FetchError } from "../src/core/errors.ts";

describe("consume", () => {
	test("resolves successful effect", async () => {
		const result = await consume(Effect.succeed(42));
		expect(result).toBe(42);
	});

	test("rejects failed effect", async () => {
		await expect(consume(Effect.fail(new FetchError("err")))).rejects.toThrow();
	});
});

describe("consumeAll", () => {
	test("resolves all successful effects", async () => {
		const effects = [Effect.succeed(1), Effect.succeed(2), Effect.succeed(3)];
		const result = await consumeAll(effects);
		expect(result).toEqual([1, 2, 3]);
	});

	test("rejects if any effect fails", async () => {
		const effects = [
			Effect.succeed(1),
			Effect.fail(new FetchError("err")),
			Effect.succeed(3),
		];
		await expect(consumeAll(effects)).rejects.toThrow();
	});
});

describe("consumeAllSuccess", () => {
	test("resolves all successful effects", async () => {
		const effects = [Effect.succeed(1), Effect.succeed(2), Effect.succeed(3)];
		const result = await consumeAllSuccess(effects);
		expect(result).toEqual([1, 2, 3]);
	});
});
