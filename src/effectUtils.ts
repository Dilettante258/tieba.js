import { Effect, Either } from "effect";

export const consume = <T>(effect: Effect.Effect<T, Error>) => {
  return effect.pipe(
    Effect.runPromise
  );
};

export const consumeAll = <T>(effects: Effect.Effect<T, Error>[], concurrency = 10) => {
  return Effect.runPromise(Effect.all(effects, { concurrency }));
};

export const consumeAllSuccess = <T>(effects: Effect.Effect<T, Error>[], concurrency = 10) => {
  return Effect.runPromise(Effect.all(effects, { concurrency, mode: "validate" }));
};










