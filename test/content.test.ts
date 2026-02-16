import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { processContent } from "../src/helpers/content.ts";

describe("processContent", () => {
	test("returns empty string for null/undefined input", () => {
		const result = Effect.runSync(processContent(null as never));
		expect(result).toBe("");
		const result2 = Effect.runSync(processContent(undefined as never));
		expect(result2).toBe("");
	});

	test("processes plain text (type 0)", () => {
		const result = Effect.runSync(
			processContent([{ type: 0, text: "Hello World" }]),
		);
		expect(result).toBe("Hello World");
	});

	test("processes link (type 1) in plaintext mode", () => {
		const result = Effect.runSync(
			processContent([{ type: 1, text: "https://example.com" }], true),
		);
		expect(result).toBe("https://example.com");
	});

	test("processes link (type 1) in rich mode", () => {
		const result = Effect.runSync(
			processContent([{ type: 1, text: "https://example.com" }], false),
		);
		expect(result).toContain("链接");
	});

	test("processes emoji (type 2)", () => {
		const result = Effect.runSync(processContent([{ type: 2, c: "微笑" }]));
		expect(result).toBe("#(微笑)");
	});

	test("handles 升起 emoji special case", () => {
		const result = Effect.runSync(processContent([{ type: 2, c: "升起" }]));
		expect(result).toBe("#(生气)");
	});

	test("processes image (type 3) in plaintext mode", () => {
		const result = Effect.runSync(
			processContent([{ type: 3, cdnSrc: "http://img.com/a.jpg" }], true),
		);
		expect(result).toContain("#[图片]");
	});

	test("processes image (type 3) in rich mode", () => {
		const result = Effect.runSync(
			processContent([{ type: 3, cdnSrc: "http://img.com/a.jpg" }], false),
		);
		expect(result).toContain("http://img.com/a.jpg");
	});

	test("processes video (type 5) in plaintext mode", () => {
		const result = Effect.runSync(processContent([{ type: 5 }], true));
		expect(result).toContain("#[视频]");
	});

	test("processes voice (type 10) in plaintext mode", () => {
		const result = Effect.runSync(processContent([{ type: 10 }], true));
		expect(result).toContain("#[语音]");
	});

	test("concatenates multiple content items", () => {
		const result = Effect.runSync(
			processContent([
				{ type: 0, text: "Hello " },
				{ type: 2, c: "微笑" },
				{ type: 0, text: " World" },
			]),
		);
		expect(result).toBe("Hello #(微笑) World");
	});

	test("ignores unknown types", () => {
		const result = Effect.runSync(
			processContent([
				{ type: 0, text: "A" },
				{ type: 999 },
				{ type: 0, text: "B" },
			]),
		);
		expect(result).toBe("AB");
	});
});
