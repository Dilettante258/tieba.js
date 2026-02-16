import { Effect, pipe, Schedule } from "effect";
import { type Dispatcher, FormData, request } from "undici";
import { FetchError } from "./errors.ts";

export const BASE_URL = "http://tiebac.baidu.com";

export const CLIENT_VERSION = "12.64.1.1";
export const CLIENT_VERSION_OLD = "8.9.8.5";
export const CLIENT_TYPE = 2;

/**
 * 发起 HTTP 请求，失败时指数退避重试。
 */
export function requestWithRetry(
	url: string,
	requestOptions: Parameters<typeof request>[1] = { method: "GET" },
	getBody: keyof Dispatcher.BodyMixin = "arrayBuffer",
	retries = 3,
	delay = 1000,
) {
	const urlObj = new URL(url, url.startsWith("http") ? undefined : BASE_URL);
	return Effect.tryPromise({
		try: () =>
			request(urlObj, requestOptions).then((res) => {
				if (res.statusCode >= 400) {
					return new FetchError(res.statusCode.toString());
				}
				return res.body;
			}),
		catch: (unknown) => Effect.fail(unknown),
	}).pipe(
		Effect.andThen(async (body) => {
			if (!(body instanceof FetchError)) {
				switch (getBody) {
					case "json":
						return (await body.json()) as unknown;
					case "arrayBuffer":
						return (await body.arrayBuffer()) as ArrayBuffer;
					default:
						return (await body.text()) as string;
				}
			}
			return body;
		}),
		Effect.retry({
			schedule: Schedule.exponential(delay),
			times: retries,
		}),
		Effect.catchAll((error) => Effect.fail(new FetchError(error))),
	);
}

/**
 * GET 请求，返回解析后的 JSON。
 */
export function getData<T>(
	url: string,
	requestOptions: Parameters<typeof request>[1] = { method: "GET" },
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
