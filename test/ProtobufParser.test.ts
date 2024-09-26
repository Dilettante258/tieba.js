import { test, describe, it } from "node:test";
import assert from "node:assert";
import { userPostReqSerialize, userPostResDeserialize, postReqSerialize, postResDeserialize } from "../src/ProtobufParser";
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
    let result= await userPostResDeserialize(responseData);
    assert(result.length > 0);
  });

  it("userPostReq", async () => {
    const params = new URLSearchParams({
      tid: '9184321095',
      page: '2',
    });
    let payload = await postReqSerialize(params);
  });

  it("userPostRes", async () => {
    const params = new URLSearchParams({
      'tid': '9184321095',
      'page': '2',
    });
    let buffer = await postReqSerialize(params);
    let responseData = await postProtobuf('/c/f/pb/page?cmd=303002', buffer);
    let result= await postResDeserialize(responseData);
    assert(result.length > 0);
  });

});