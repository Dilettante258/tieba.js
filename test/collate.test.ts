import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { collatePost } from "../src/helpers/collate.ts";

describe("collatePost", () => {
	const makePost = (text: string) => ({
		content: [{ type: 0, text }],
		agree: { agreeNum: 10, disagreeNum: 2 },
		subPostNumber: 0,
	});

	test("processes single post content", () => {
		const result = Effect.runSync(collatePost([makePost("Hello")]));
		expect(result).toHaveLength(1);
		expect(result[0].content).toBe("Hello");
		expect(result[0].agree.agreeNum).toBe(10);
		expect(result[0].agree.disagreeNum).toBe(2);
	});

	test("processes multiple posts", () => {
		const posts = [makePost("First"), makePost("Second"), makePost("Third")];
		const result = Effect.runSync(collatePost(posts));
		expect(result).toHaveLength(3);
		expect(result[0].content).toBe("First");
		expect(result[1].content).toBe("Second");
		expect(result[2].content).toBe("Third");
	});

	test("processes post with signature", () => {
		const post = {
			...makePost("Content"),
			signature: { content: [{ type: 0, text: "My Signature" }] },
		};
		const result = Effect.runSync(collatePost([post]));
		expect(result[0].signature).toBe("My Signature");
	});

	test("handles post without comments when withComment=false", () => {
		const post = {
			...makePost("Content"),
			subPostList: { subPostList: [] },
			subPostNumber: 0,
		};
		const result = Effect.runSync(collatePost([post], false));
		expect(result[0].subPostList).toBeUndefined();
	});

	test("handles post with comments", () => {
		const post = {
			...makePost("Content"),
			subPostList: {
				subPostList: [
					{
						id: "1",
						time: "1700000000",
						authorId: "user1",
						content: [{ type: 0, text: "A comment" }],
					},
				],
			},
			subPostNumber: 1,
		};
		const result = Effect.runSync(collatePost([post], true));
		expect(result[0].subPostList).toHaveLength(1);
		expect(result[0].subPostList?.[0].content).toBe("A comment");
		expect(result[0].subPostList?.[0].id).toBe("1");
	});

	test("returns undefined subPostList when subPostNumber is 0", () => {
		const post = {
			...makePost("Content"),
			subPostList: { subPostList: [] },
			subPostNumber: 0,
		};
		const result = Effect.runSync(collatePost([post], true));
		expect(result[0].subPostList).toBeUndefined();
	});

	test("returns empty array for empty input", () => {
		const result = Effect.runSync(collatePost([]));
		expect(result).toEqual([]);
	});
});
