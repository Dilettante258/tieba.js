import { test, describe, it } from "node:test";
import assert from "node:assert";
import { userPostReqSerialize, userPostResDeserialize } from "../src/ProtobufParser";
import {postProtobuf} from "../src/utils";

describe("ProtobufParser", () => {
  it("userPostReq", async () => {
    let payload = await userPostReqSerialize(5991323492, 1);
    let correct = Buffer.from('0a1708e4aef1a8162801d00101da01091207382e392e382e35','hex');
    assert.strictEqual(payload.toString(), correct.toString());
  });

  it("userPostRes", async () => {
    const buffer = await userPostReqSerialize(5991323492, 1);
    let responseData = await postProtobuf('/c/u/feed/userpost?cmd=303002', buffer);
    userPostResDeserialize(responseData);
  });
});