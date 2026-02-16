import { Effect } from "effect";
import type { TiebaClient } from "../client.ts";
import { TiebaServerError } from "./errors.ts";
import { postFormData } from "./http.ts";

interface FormApiResponse {
	error_code: string;
	error_msg?: string;
	error?: string;
	[key: string]: unknown;
}

/**
 * 表单编码写操作 API 工厂函数。
 * 处理通用流程：getTbs → 合并 BDUSS+tbs+params → packRequest → postFormData → 检查 error_code。
 */
export function createFormApi<Params, Result = void>(config: {
	endpoint: string;
	buildParams: (params: Params) => Record<string, string>;
	extractResult?: (res: FormApiResponse) => Result;
}) {
	return (client: TiebaClient, params: Params) =>
		Effect.gen(function* () {
			const tbs = yield* client.getTbs();
			const formParams = {
				BDUSS: client.bduss,
				tbs,
				...config.buildParams(params),
			};
			const res = yield* postFormData<FormApiResponse>(
				config.endpoint,
				client.packRequest(formParams),
			);

			const code = Number(res.error_code);
			if (code !== 0) {
				throw new TiebaServerError(code, res.error_msg ?? res.error ?? "");
			}
			if (config.extractResult) {
				return config.extractResult(res);
			}
			return undefined as Result;
		});
}
