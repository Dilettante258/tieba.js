import type { TiebaClient } from "./client.ts";

let _client: TiebaClient | null = null;

/**
 * 获取已初始化的 TiebaClient 单例。
 * 必须先调用 `initClient()` 进行初始化。
 */
export function getClient(): TiebaClient {
	if (!_client) {
		throw new Error("TiebaClient 未初始化，请先调用 initClient()");
	}
	return _client;
}

/**
 * 初始化 TiebaClient 单例。
 * 应在应用启动时调用一次。
 */
export function initClient(client: TiebaClient): void {
	_client = client;
}
