import { describe, expect, test } from "bun:test";
import { TiebaClient } from "../src/client.ts";

describe("TiebaClient", () => {
	test("stores bduss", () => {
		const client = new TiebaClient({ bduss: "my_bduss" });
		expect(client.bduss).toBe("my_bduss");
	});

	test("uses default options when not provided", () => {
		const client = new TiebaClient({ bduss: "test" });
		expect(client.options.needPlainText).toBe(true);
		expect(client.options.needTimestamp).toBe(false);
		expect(client.options.timeFormat).toBeInstanceOf(Intl.DateTimeFormat);
	});

	test("merges partial options with defaults", () => {
		const client = new TiebaClient({
			bduss: "test",
			options: { needPlainText: false },
		});
		expect(client.options.needPlainText).toBe(false);
		expect(client.options.needTimestamp).toBe(false);
	});

	test("overrides all options when provided", () => {
		const fmt = new Intl.DateTimeFormat("en-US");
		const client = new TiebaClient({
			bduss: "test",
			options: {
				needPlainText: false,
				needTimestamp: true,
				timeFormat: fmt,
			},
		});
		expect(client.options.needPlainText).toBe(false);
		expect(client.options.needTimestamp).toBe(true);
		expect(client.options.timeFormat).toBe(fmt);
	});

	test("packRequest delegates to auth module", () => {
		const client = new TiebaClient({ bduss: "test_bduss" });
		const result = client.packRequest({ foo: "bar" });
		expect(result).toContain("BDUSS=test_bduss");
		expect(result).toMatch(/sign=[A-F0-9]{32}/);
	});
});
