import { describe, expect, test } from "bun:test";
import {
	FetchError,
	InvalidParamError,
	NotFoundError,
	ParseError,
	TiebaError,
	TiebaServerError,
} from "../src/core/errors.ts";

describe("Error classes", () => {
	test("all errors extend TiebaError and Error", () => {
		const errors = [
			new FetchError("network"),
			new TiebaServerError(1, "err"),
			new InvalidParamError("bad"),
			new NotFoundError("missing"),
			new ParseError("parse"),
		];
		for (const err of errors) {
			expect(err).toBeInstanceOf(TiebaError);
			expect(err).toBeInstanceOf(Error);
		}
	});

	test("FetchError has correct tag, httpStatus, and message", () => {
		const err = new FetchError("network failure");
		expect(err._tag).toBe("FetchError");
		expect(err.httpStatus).toBe(502);
		expect(err.message).toBe("network failure");
		expect(err.cause).toBe("network failure");
	});

	test("FetchError wraps Error cause into message", () => {
		const original = new Error("timeout");
		const err = new FetchError(original);
		expect(err.message).toBe("timeout");
		expect(err.cause).toBe(original);
	});

	test("TiebaServerError stores code and msg", () => {
		const err = new TiebaServerError(10001, "参数错误");
		expect(err._tag).toBe("TiebaServerError");
		expect(err.httpStatus).toBe(502);
		expect(err.code).toBe(10001);
		expect(err.msg).toBe("参数错误");
		expect(err.message).toBe("Tieba API error 10001: 参数错误");
	});

	test("InvalidParamError has correct tag and httpStatus", () => {
		const err = new InvalidParamError("page out of range");
		expect(err._tag).toBe("InvalidParamError");
		expect(err.httpStatus).toBe(400);
		expect(err.message).toBe("page out of range");
	});

	test("NotFoundError has correct tag and httpStatus", () => {
		const err = new NotFoundError("user not found");
		expect(err._tag).toBe("NotFoundError");
		expect(err.httpStatus).toBe(404);
		expect(err.message).toBe("user not found");
	});

	test("ParseError has correct tag and httpStatus", () => {
		const err = new ParseError("invalid json");
		expect(err._tag).toBe("ParseError");
		expect(err.httpStatus).toBe(500);
		expect(err.message).toBe("invalid json");
	});

	test("instanceof works after throw/catch", () => {
		try {
			throw new NotFoundError("test");
		} catch (e) {
			expect(e).toBeInstanceOf(NotFoundError);
			expect(e).toBeInstanceOf(TiebaError);
			expect(e).toBeInstanceOf(Error);
		}
	});
});
