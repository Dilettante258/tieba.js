import { describe, expect, test } from "bun:test";
import {
	buildProtoMultipartFormData,
	PROTO_MULTIPART_FILENAME,
} from "../src/core/http.ts";

describe("HTTP helpers", () => {
	test("buildProtoMultipartFormData sets stable filename for protobuf payload", () => {
		const payload = Uint8Array.from([0x01, 0x02, 0x03, 0xff]);
		const form = buildProtoMultipartFormData(payload);
		const part = form.get("data");

		expect(part).toBeDefined();
		expect(part).toBeInstanceOf(File);
		expect((part as File).name).toBe(PROTO_MULTIPART_FILENAME);
		expect((part as File).size).toBe(payload.length);
	});
});
