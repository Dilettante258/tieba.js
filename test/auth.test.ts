import { describe, expect, test } from "bun:test";
import { packRequest } from "../src/core/auth.ts";

describe("packRequest", () => {
	const BDUSS = "test_bduss_value";

	test("appends BDUSS when not provided", () => {
		const result = packRequest({ foo: "bar" }, BDUSS);
		expect(result).toContain("BDUSS=test_bduss_value");
	});

	test("preserves existing BDUSS", () => {
		const result = packRequest({ BDUSS: "custom_bduss", foo: "bar" }, BDUSS);
		expect(result).toContain("BDUSS=custom_bduss");
		expect(result).not.toContain("BDUSS=test_bduss_value");
	});

	test("appends _client_version when not provided", () => {
		const result = packRequest({}, BDUSS);
		expect(result).toContain("_client_version=12.57.4.2");
	});

	test("replaces page param with pn", () => {
		const result = packRequest({ page: "3" }, BDUSS);
		expect(result).toContain("pn=3");
		expect(result).not.toContain("page=");
	});

	test("defaults pn to 1 when no page param", () => {
		const result = packRequest({}, BDUSS);
		expect(result).toContain("pn=1");
	});

	test("includes MD5 sign at the end", () => {
		const result = packRequest({ foo: "bar" }, BDUSS);
		expect(result).toMatch(/sign=[A-F0-9]{32}/);
	});

	test("sign is deterministic for same input", () => {
		const result1 = packRequest({ a: "1", b: "2" }, BDUSS);
		const result2 = packRequest({ a: "1", b: "2" }, BDUSS);
		expect(result1).toBe(result2);
	});

	test("params are sorted before signing", () => {
		const result1 = packRequest({ z: "1", a: "2" }, BDUSS);
		const result2 = packRequest({ a: "2", z: "1" }, BDUSS);
		expect(result1).toBe(result2);
	});
});
