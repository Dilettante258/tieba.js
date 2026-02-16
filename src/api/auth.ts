import { Effect, pipe } from "effect";
import type { TiebaClient } from "../client.ts";
import { TiebaServerError } from "../core/errors.ts";
import { postFormData } from "../core/http.ts";

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

/**
 * 通过登录接口获取 TBS（反 CSRF）令牌。
 * 所有写操作（发帖、删帖、签到、点赞等）都需要 TBS。
 */
export function getTbs(client: TiebaClient) {
	return pipe(
		postFormData<LoginResponse>(
			"/c/s/login",
			client.packRequest({ bdusstoken: client.bduss }),
		),
		Effect.map((res) => {
			if (Number(res.error_code) !== 0) {
				throw new TiebaServerError(Number(res.error_code), res.error_msg ?? "");
			}
			return res.anti?.tbs ?? "";
		}),
	);
}
