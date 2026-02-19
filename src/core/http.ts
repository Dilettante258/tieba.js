import { Effect, pipe, Schedule } from "effect";
import { Agent, type Dispatcher, FormData, request } from "undici";
import { FetchError } from "./errors.ts";

export const BASE_URL = "http://tiebac.baidu.com";

export const CLIENT_VERSION = "12.64.1.1";
export const CLIENT_VERSION_OLD = "8.9.8.5";
export const CLIENT_TYPE = 2;

type RequestOptions = NonNullable<Parameters<typeof request>[1]>;
type ResponseBodyType = "json" | "arrayBuffer" | "text";

const defaultRequestOptions: RequestOptions = { method: "GET" };

/**
 * SDK 默认共享连接池：
 * - 复用 keep-alive 连接，减少 TLS/TCP 建连开销
 * - 避免每次请求走全局默认 dispatcher，便于统一调优
 */
const defaultAgent = new Agent({
	connections: 32,
	pipelining: 1,
	connectTimeout: 10_000,
	headersTimeout: 30_000,
	bodyTimeout: 30_000,
	keepAliveTimeout: 10_000,
	keepAliveMaxTimeout: 60_000,
	autoSelectFamily: true,
	autoSelectFamilyAttemptTimeout: 250,
});

let sharedDispatcher: Dispatcher = defaultAgent;

/** 允许调用方注入自定义 dispatcher（例如 ProxyAgent 或限流 Agent）。 */
export function setHttpDispatcher(dispatcher: Dispatcher): void {
	sharedDispatcher = dispatcher;
}

/** 重置为 SDK 默认共享 Agent。 */
export function resetHttpDispatcher(): void {
	sharedDispatcher = defaultAgent;
}

function withDispatcher(options: RequestOptions): RequestOptions {
	if (options.dispatcher) return options;
	return { ...options, dispatcher: sharedDispatcher };
}

/**
 * 发起 HTTP 请求，失败时指数退避重试。
 */
export function requestWithRetry(
	url: string,
	requestOptions: RequestOptions = defaultRequestOptions,
	getBody: ResponseBodyType = "arrayBuffer",
	retries = 3,
	delay = 1000,
) {
	const urlObj = new URL(url, url[0] === 'h' ? undefined : BASE_URL);
	return Effect.tryPromise({
		try: async () => {
			const res = await request(urlObj, withDispatcher(requestOptions));
			if (res.statusCode >= 400) {
				// Undici 建议消费或取消 body，以便连接尽快回收到池中。
				await res.body.dump().catch(() => undefined);
				throw new FetchError(`${res.statusCode} ${res.statusText}`.trim());
			}
			return res.body[getBody]();
		},
		catch: (error) =>
			error instanceof FetchError ? error : new FetchError(error),
	}).pipe(
		Effect.retry({
			schedule: Schedule.exponential(delay),
			times: retries,
		}),
	);
}

/**
 * GET 请求，返回解析后的 JSON。
 */
export function getData<T>(
	url: string,
	requestOptions: RequestOptions = defaultRequestOptions,
): Effect.Effect<T, FetchError> {
	return requestWithRetry(url, requestOptions, "json") as Effect.Effect<
		T,
		FetchError
	>;
}

/**
 * POST 表单编码数据，返回解析后的 JSON。
 */
export function postFormData<T>(
	url: string,
	data: string,
): Effect.Effect<T, FetchError> {
	return requestWithRetry(
		url,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		},
		"json",
	) as Effect.Effect<T, FetchError>;
}

/**
 * POST protobuf 二进制数据，返回原始 ArrayBuffer。
 */
export function postProtobuf(url: string, buffer: Uint8Array) {
	return pipe(
		new Blob([Buffer.from(buffer)]),
		(blob) => {
			const data = new FormData();
			data.set("data", blob);
			return data;
		},
		(data) =>
			requestWithRetry(
				BASE_URL + url,
				{
					method: "POST",
					headers: {
						x_bd_data_type: "protobuf",
					},
					body: data,
				},
				"arrayBuffer",
			),
		Effect.andThen((buf) => new Uint8Array(buf as ArrayBuffer)),
	);
}
