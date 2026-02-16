import { Effect } from "effect";
import type { TiebaError } from "./errors.ts";

/**
 * 将单个 Effect 运行为 Promise。
 */
export const consume = <T>(
	effect: Effect.Effect<T, TiebaError>,
): Promise<T> => {
	return effect.pipe(Effect.runPromise);
};

/**
 * 并发运行多个 Effect，返回 Promise。
 */
export const consumeAll = <T>(
	effects: Effect.Effect<T, TiebaError>[],
	concurrency = 10,
): Promise<T[]> => {
	return Effect.runPromise(Effect.all(effects, { concurrency }));
};

/**
 * 并发运行多个 Effect（validate 模式，忽略失败项）。
 */
export const consumeAllSuccess = <T>(
	effects: Effect.Effect<T, TiebaError>[],
	concurrency = 10,
) => {
	return Effect.runPromise(
		Effect.all(effects, { concurrency, mode: "validate" }),
	);
};
