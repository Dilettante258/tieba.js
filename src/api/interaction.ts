import { Effect } from "effect";
import { getClient } from "../context.ts";
import { TiebaServerError } from "../core/errors.ts";
import { CLIENT_VERSION, postFormData } from "../core/http.ts";

// ── 点赞 / 点踩 ──────────────────────────────────────────

export interface AgreeParams {
	tid: number;
	/** 回复 ID，省略时对主题本身操作。 */
	pid?: number;
	/** 对象类型：3=主题 1=回复 2=楼中楼。省略时根据 pid 自动判断。 */
	objType?: number;
	/** 设为 true 则点踩而非点赞。 */
	isDisagree?: boolean;
	/** 设为 true 则撤销之前的点赞/点踩。 */
	isUndo?: boolean;
}

interface AgreeResponse {
	error_code: string;
	error_msg?: string;
	error?: string;
}

/** 对主题或回复点赞/点踩。 */
export function agree(params: AgreeParams) {
	return Effect.gen(function* () {
		const client = getClient();
		const tbs = yield* client.getTbs();
		const objType = params.objType ?? (params.pid ? 1 : 3);
		const formData = {
			BDUSS: client.bduss,
			_client_version: CLIENT_VERSION,
			tbs,
			thread_id: params.tid.toString(),
			post_id: params.pid?.toString() ?? "0",
			obj_type: objType.toString(),
			agree_type: params.isDisagree ? "5" : "2",
			op_type: params.isUndo ? "1" : "0",
		};
		const res = yield* postFormData<AgreeResponse>(
			"/c/c/agree/opAgree",
			client.packRequest(formData),
		);
		const code = Number(res.error_code);
		if (code !== 0) {
			throw new TiebaServerError(code, res.error_msg ?? res.error ?? "");
		}
	});
}

/** 对主题或回复点踩。是 agree() 的便捷封装。 */
export function disagree(tid: number, pid?: number) {
	return agree({ tid, pid, isDisagree: true });
}
