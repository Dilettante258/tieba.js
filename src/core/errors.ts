/**
 * SDK 所有错误的基类。
 * 继承原生 Error 以便 Effect.runPromise 后 instanceof 仍然有效。
 * 包含 httpStatus 用于 API 层错误响应映射。
 */
export abstract class TiebaError extends Error {
	abstract readonly _tag: string;
	abstract readonly httpStatus: number;
}

/**
 * 网络或 HTTP 请求失败（如超时、DNS 错误、状态码 >= 400）。
 */
export class FetchError extends TiebaError {
	readonly _tag = "FetchError";
	readonly httpStatus = 502;
	constructor(readonly cause: unknown) {
		super(cause instanceof Error ? cause.message : String(cause));
	}
}

/**
 * 贴吧 API 返回业务错误（errorno != 0）。
 */
export class TiebaServerError extends TiebaError {
	readonly _tag = "TiebaServerError";
	readonly httpStatus = 502;
	constructor(
		readonly code: number,
		readonly msg: string,
	) {
		super(`Tieba API error ${code}: ${msg}`);
	}
}

/**
 * 调用方传入了无效参数。
 */
export class InvalidParamError extends TiebaError {
	readonly _tag = "InvalidParamError";
	readonly httpStatus = 400;
}

/**
 * 请求的资源不存在（如用户不存在）。
 */
export class NotFoundError extends TiebaError {
	readonly _tag = "NotFoundError";
	readonly httpStatus = 404;
}

/**
 * 响应数据解析失败。
 */
export class ParseError extends TiebaError {
	readonly _tag = "ParseError";
	readonly httpStatus = 500;
	constructor(
		message: string,
		readonly cause?: unknown,
	) {
		super(message);
	}
}
