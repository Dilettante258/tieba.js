import { Effect, pipe, type Effect as EffectNS } from "effect";
import { packRequest } from "./core/auth.ts";
import { TiebaServerError } from "./core/errors.ts";
import type { FetchError } from "./core/errors.ts";
import { getData, postFormData, postProtobuf } from "./core/http.ts";

export interface ClientOptions {
	needPlainText: boolean;
	needTimestamp: boolean;
	timeFormat: Intl.DateTimeFormat;
}

const defaultOptions: ClientOptions = {
	needPlainText: true,
	needTimestamp: false,
	timeFormat: new Intl.DateTimeFormat("zh-CN", {
		timeStyle: "short",
		dateStyle: "short",
	}),
};

interface LoginResponse {
	error_code: string;
	error_msg?: string;
	anti?: { tbs: string };
	user?: {
		id: string;
		name: string;
		portrait: string;
	};
}

export class TiebaClient {
	readonly bduss: string;
	readonly options: ClientOptions;
	private _tbs?: string;

	constructor(config: { bduss: string; options?: Partial<ClientOptions>; }) {
		this.bduss = config.bduss;
		this.options = { ...defaultOptions, ...config.options };
	}

	/**
	 * 获取 TBS 令牌（懒加载并缓存）。
	 * 所有写操作都需要此令牌。
	 */
	getTbs(): EffectNS.Effect<string, FetchError> {
		if (this._tbs) {
			return Effect.succeed(this._tbs);
		}
		const self = this;
		return pipe(
			postFormData<LoginResponse>(
				"/c/s/login",
				self.packRequest({ bdusstoken: self.bduss }),
			),
			Effect.map((res) => {
				if (Number(res.error_code) !== 0) {
					throw new TiebaServerError(Number(res.error_code), res.error_msg ?? "");
				}
				const tbs = res.anti?.tbs ?? "";
				self._tbs = tbs;
				return tbs;
			}),
		);
	}

	// --- 内部 HTTP 方法（供 API 模块使用） ---

	/** @internal */
	postProtobuf(
		url: string,
		buffer: Uint8Array,
	): EffectNS.Effect<Uint8Array, FetchError> {
		return postProtobuf(url, buffer);
	}

	/** @internal */
	postFormData<T>(url: string, data: string): EffectNS.Effect<T, FetchError> {
		return postFormData<T>(url, data);
	}

	/** @internal */
	getData<T>(url: string): EffectNS.Effect<T, FetchError> {
		return getData<T>(url);
	}

	/** @internal */
	packRequest(
		data: ConstructorParameters<typeof URLSearchParams>[number],
	): string {
		return packRequest(data, this.bduss);
	}
}
