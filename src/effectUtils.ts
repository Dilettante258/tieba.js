import { Effect } from "effect";

export const consume = <T>(
	effect: Effect.Effect<
		T,
		{
			_tag: string;
		}
	>,
) => {
	return effect.pipe(Effect.runPromise);
};

export const consumeAll = <T>(
	effects: Effect.Effect<
		T,
		{
			_tag: string;
		}
	>[],
	concurrency = 10,
) => {
	return Effect.runPromise(Effect.all(effects, { concurrency }));
};

export const consumeAllSuccess = <T>(
	effects: Effect.Effect<
		T,
		{
			_tag: string;
		}
	>[],
	concurrency = 10,
) => {
	return Effect.runPromise(
		Effect.all(effects, { concurrency, mode: "validate" }),
	);
};
