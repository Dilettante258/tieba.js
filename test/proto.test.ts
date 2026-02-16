import { describe, expect, test } from "bun:test";
import { FrsPageReqIdl } from "../src/generated/FrsPageReqIdl.ts";
import { FrsPageResIdl } from "../src/generated/FrsPageResIdl.ts";
import { GetForumDetailReqIdl } from "../src/generated/GetForumDetailReqIdl.ts";
import { GetUserByUidReqIdl } from "../src/generated/GetUserByUidReqIdl.ts";
import { PbPageReqIdl } from "../src/generated/PbPageReqIdl.ts";
import { PbPageResIdl } from "../src/generated/PbPageResIdl.ts";
import { ProfileReqIdl } from "../src/generated/ProfileReqIdl.ts";
import { UserPostReqIdl } from "../src/generated/UserPostReqIdl.ts";

describe("Proto encode/decode roundtrip", () => {
	test("PbPageReqIdl (get-posts)", () => {
		const original = PbPageReqIdl.fromPartial({
			data: {
				kz: "12345",
				pn: 1,
				rn: 30,
				common: { ClientVersion: "12.64.1.1", ClientType: 2 },
			},
		});
		const encoded = PbPageReqIdl.encode(original).finish();
		expect(encoded.length).toBeGreaterThan(0);

		const decoded = PbPageReqIdl.decode(encoded);
		expect(decoded.data?.kz).toBe("12345");
		expect(decoded.data?.pn).toBe(1);
		expect(decoded.data?.rn).toBe(30);
		expect(decoded.data?.common?.ClientVersion).toBe("12.64.1.1");
		expect(decoded.data?.common?.ClientType).toBe(2);
	});

	test("FrsPageReqIdl (get-threads)", () => {
		const original = FrsPageReqIdl.fromPartial({
			data: {
				kw: "test_forum",
				pn: 2,
				rn: 105,
				rnNeed: 30,
				isGood: 0,
				sortType: 1,
				common: { ClientVersion: "12.64.1.1", ClientType: 2 },
			},
		});
		const encoded = FrsPageReqIdl.encode(original).finish();
		const decoded = FrsPageReqIdl.decode(encoded);
		expect(decoded.data?.kw).toBe("test_forum");
		expect(decoded.data?.pn).toBe(2);
		expect(decoded.data?.rnNeed).toBe(30);
	});

	test("ProfileReqIdl (get-profile) with uid", () => {
		const original = ProfileReqIdl.fromPartial({
			data: {
				uid: "123456",
				needPostCount: 1,
				pn: 1,
				common: { ClientVersion: "12.64.1.1" },
			},
		});
		const encoded = ProfileReqIdl.encode(original).finish();
		const decoded = ProfileReqIdl.decode(encoded);
		expect(decoded.data?.uid).toBe("123456");
		expect(decoded.data?.needPostCount).toBe(1);
	});

	test("ProfileReqIdl (get-profile) with portrait", () => {
		const original = ProfileReqIdl.fromPartial({
			data: {
				friendUidPortrait: "tb.1.portrait",
				needPostCount: 1,
				pn: 1,
				common: { ClientVersion: "12.64.1.1" },
			},
		});
		const encoded = ProfileReqIdl.encode(original).finish();
		const decoded = ProfileReqIdl.decode(encoded);
		expect(decoded.data?.friendUidPortrait).toBe("tb.1.portrait");
	});

	test("GetForumDetailReqIdl (get-forum-detail)", () => {
		const original = GetForumDetailReqIdl.fromPartial({
			data: {
				forumId: "99999",
				common: { ClientVersion: "12.64.1.1" },
			},
		});
		const encoded = GetForumDetailReqIdl.encode(original).finish();
		const decoded = GetForumDetailReqIdl.decode(encoded);
		expect(decoded.data?.forumId).toBe("99999");
	});

	test("GetUserByUidReqIdl (get-user-by-uid)", () => {
		const original = GetUserByUidReqIdl.fromPartial({
			data: {
				tiebaUid: "42",
				common: { ClientVersion: "12.64.1.1", ClientType: 2 },
			},
		});
		const encoded = GetUserByUidReqIdl.encode(original).finish();
		const decoded = GetUserByUidReqIdl.decode(encoded);
		expect(decoded.data?.tiebaUid).toBe("42");
	});

	test("UserPostReqIdl (get-user-post)", () => {
		const original = UserPostReqIdl.fromPartial({
			data: {
				userId: "100",
				needContent: 1,
				pn: 5,
				common: { ClientVersion: "8.9.8.5" },
			},
		});
		const encoded = UserPostReqIdl.encode(original).finish();
		const decoded = UserPostReqIdl.decode(encoded);
		expect(decoded.data?.userId).toBe("100");
		expect(decoded.data?.needContent).toBe(1);
		expect(decoded.data?.pn).toBe(5);
	});

	test("PbPageResIdl decodes empty response", () => {
		const empty = PbPageResIdl.fromPartial({});
		const encoded = PbPageResIdl.encode(empty).finish();
		const decoded = PbPageResIdl.decode(encoded);
		expect(decoded.error).toBeUndefined();
	});

	test("FrsPageResIdl decodes empty response", () => {
		const empty = FrsPageResIdl.fromPartial({});
		const encoded = FrsPageResIdl.encode(empty).finish();
		const decoded = FrsPageResIdl.decode(encoded);
		expect(decoded.error).toBeUndefined();
	});
});
