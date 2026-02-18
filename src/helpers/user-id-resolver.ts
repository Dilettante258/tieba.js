import { Cache, Cause, Duration, Effect, Exit, Option } from "effect";
import { getUserByUid, getProfile } from "../api/user.ts";
import { getUserInfo } from "../api/user.ts";
import { NotFoundError, type FetchError } from "../core/errors.ts";

export enum MethodEnum {
	uid = "uid",
	id = "id",
	un = "un",
}

// ── 用户标识映射 ──────────────────────────────────────────

interface UserIdMap {
	uid?: number;
	id?: number;
	un?: string;
}

const CACHE_CAPACITY = 1000;
const CACHE_TTL = Duration.hours(24);

type IdCache<K> = Cache.Cache<K, UserIdMap, FetchError>;

// ── UserIdResolver ────────────────────────────────────────

/**
 * 用户标识转换器，使用 Effect Cache 缓存 API 结果。
 * 三个独立缓存分别存储 un→map、id→map、uid→map 的映射关系，
 * 24 小时 TTL，并自动去重并发请求。
 *
 * 用法：`await UserIdResolver.resolve(method, id, MethodEnum.id)`
 */
export class UserIdResolver {
	private static initPromise: Promise<UserIdResolver> | undefined;

	private constructor(
		private readonly unCache: IdCache<string>,
		private readonly idCache: IdCache<number>,
		private readonly uidCache: IdCache<number>,
	) { }

	/** 创建实例，初始化三个 Effect Cache */
	private static make() {
		return Effect.gen(function* () {
			const unCache = yield* Cache.make({
				lookup: (un: string) =>
					Effect.gen(function* () {
						const res = yield* getUserInfo(un);
						return { un, id: Number(res.id) } as UserIdMap;
					}),
				capacity: CACHE_CAPACITY,
				timeToLive: CACHE_TTL,
			});

			const idCache = yield* Cache.make({
				lookup: (id: number) =>
					Effect.gen(function* () {
						const profile = yield* getProfile(id);
						const user = profile?.user;
						return {
							id,
							uid: user?.tiebaUid ? Number(user.tiebaUid) : undefined,
							un: user?.name || undefined,
						} as UserIdMap;
					}),
				capacity: CACHE_CAPACITY,
				timeToLive: CACHE_TTL,
			});

			const uidCache = yield* Cache.make({
				lookup: (uid: number) =>
					Effect.gen(function* () {
						const user = yield* getUserByUid(uid);
						return {
							uid,
							id: user?.id ? Number(user.id) : undefined,
							un: user?.name || undefined,
						} as UserIdMap;
					}),
				capacity: CACHE_CAPACITY,
				timeToLive: CACHE_TTL,
			});

			return new UserIdResolver(unCache, idCache, uidCache);
		});
	}

	/** 获取单例（首次调用时初始化缓存） */
	private static init(): Promise<UserIdResolver> {
		if (!this.initPromise) {
			this.initPromise = Effect.runPromise(this.make());
		}
		return this.initPromise;
	}

	/** 在不同用户标识类型之间转换（内部 Effect 版本） */
	private getParams(method: MethodEnum, id: string, need: MethodEnum) {
		const self = this;
		return Effect.gen(function* () {
			// 输入类型与目标类型相同，无需转换
			if (method === need) {
				if (need === MethodEnum.un) return id;
				const num = Number(id);
				if (num === 0)
					return yield* Effect.fail(new NotFoundError("未找到用户"));
				return num;
			}

			let map: UserIdMap;
			switch (method) {
				case MethodEnum.un: {
					const partial = yield* self.unCache.get(id);
					if (need === MethodEnum.id) {
						map = partial;
						break;
					}
					// un → uid：先拿 id，再通过 getProfile 获取 uid
					if (!partial.id)
						return yield* Effect.fail(new NotFoundError("未找到用户"));
					map = yield* self.idCache.get(partial.id);
					break;
				}
				case MethodEnum.id:
					map = yield* self.idCache.get(Number(id));
					break;
				case MethodEnum.uid:
					map = yield* self.uidCache.get(Number(id));
					break;
				default:
					return yield* Effect.fail(new NotFoundError("未找到用户"));
			}

			const result = map[need as keyof UserIdMap];
			if (!result)
				return yield* Effect.fail(new NotFoundError("未找到用户"));
			return result;
		});
	}

	/**
	 * 在不同用户标识类型之间转换，结果缓存 24 小时。
	 * 通过 runPromiseExit 提取原始错误直接抛出，
	 * 保持调用方 `instanceof TiebaError` 检查正常工作。
	 */
	static async resolve(
		method: string,
		id: string,
		need: MethodEnum.uid | MethodEnum.id,
	): Promise<number>;
	static async resolve(
		method: string,
		id: string,
		need: MethodEnum.un,
	): Promise<string>;
	static async resolve(
		method: string,
		id: string,
		need: MethodEnum,
	): Promise<number | string>;
	static async resolve(
		method: string,
		id: string,
		need: MethodEnum,
	): Promise<number | string> {
		const instance = await this.init();
		const exit = await Effect.runPromiseExit(
			instance.getParams(method as MethodEnum, id, need),
		);
		if (Exit.isSuccess(exit)) return exit.value;
		const failure = Cause.failureOption(exit.cause);
		throw Option.isSome(failure) ? failure.value : new Error("未知错误");
	}
}
