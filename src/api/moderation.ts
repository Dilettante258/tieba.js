import { createFormApi } from "../core/form.ts";

// ── 封禁用户 ──────────────────────────────────────────────

export interface BlockUserParams {
	fid: number;
	portrait: string;
	reason?: string;
	/** 封禁天数（普通可选 1、3、10；其他天数需要 SVIP）。 */
	day?: number;
}

/** 在贴吧中封禁用户。 */
export const blockUser = createFormApi<BlockUserParams>({
	endpoint: "/c/c/bawu/commitprison",
	buildParams: (params) => ({
		fid: params.fid.toString(),
		portrait: params.portrait,
		reason: params.reason ?? "",
		day: (params.day ?? 1).toString(),
		ntn: "banid",
		word: "-",
		z: "6",
	}),
});

// ── 解封用户 ────────────────────────────────────────────────

export interface UnblockUserParams {
	fname: string;
	uid: string;
}

/** 解除用户封禁。 */
export const unblockUser = createFormApi<UnblockUserParams>({
	endpoint: "/c/c/bawu/unblock",
	buildParams: (params) => ({
		word: params.fname,
		un: params.uid,
	}),
});

// ── 加精 / 取消加精 ──────────────────────────────────────

export interface GoodThreadParams {
	fname: string;
	fid: number;
	tid: number;
	/** 精品帖分类名称。 */
	cname?: string;
}

/** 将帖子设为精品（加精）。 */
export const goodThread = createFormApi<GoodThreadParams>({
	endpoint: "/c/c/bawu/nopicset",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
		cname: params.cname ?? "",
	}),
});

/** 取消帖子精品标记。 */
export const ungoodThread = createFormApi<{
	fname: string;
	fid: number;
	tid: number;
}>({
	endpoint: "/c/c/bawu/delpicset",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
	}),
});

// ── 置顶 / 取消置顶 ────────────────────────────────────────

/** 置顶帖子。 */
export const topThread = createFormApi<{
	fname: string;
	fid: number;
	tid: number;
}>({
	endpoint: "/c/c/bawu/top",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
	}),
});

/** 取消置顶帖子。 */
export const untopThread = createFormApi<{
	fname: string;
	fid: number;
	tid: number;
}>({
	endpoint: "/c/c/bawu/untop",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
	}),
});

// ── 恢复删除 ────────────────────────────────────────────────

/** 恢复已删除的主题帖。 */
export const recoverThread = createFormApi<{
	fname: string;
	fid: number;
	tid: number;
}>({
	endpoint: "/c/c/bawu/recover",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
		is_frs_mask: "1",
	}),
});

/** 恢复已删除的回复。 */
export const recoverPost = createFormApi<{
	fname: string;
	fid: number;
	tid: number;
	pid: number;
}>({
	endpoint: "/c/c/bawu/recover",
	buildParams: (params) => ({
		word: params.fname,
		fid: params.fid.toString(),
		z: params.tid.toString(),
		pid: params.pid.toString(),
		is_frs_mask: "0",
	}),
});
