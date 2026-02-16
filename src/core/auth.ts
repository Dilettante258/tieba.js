import { createHash } from "node:crypto";

/**
 * 签名并打包表单编码的请求体。
 * 自动追加 BDUSS、_client_version、pn 和 MD5 签名。
 */
export function packRequest(
	data: ConstructorParameters<typeof URLSearchParams>[number],
	bduss: string,
): string {
	const params = new URLSearchParams(data);
	if (!params.has("BDUSS")) {
		params.append("BDUSS", bduss);
	}
	if (!params.has("_client_version")) {
		params.append("_client_version", "12.57.4.2");
	}
	if (!params.has("pn")) {
		params.append("pn", params.get("page") || "1");
	}
	params.delete("page");
	params.sort();

	const string = Array.from(params.entries())
		.map((entry) => entry.join("="))
		.join("");

	const sign = createHash("md5")
		.update(`${string}tiebaclient!!!`)
		.digest("hex")
		.toUpperCase();

	params.append("sign", sign);

	return Array.from(params.entries())
		.map((entry) => entry.join("="))
		.join("&");
}
