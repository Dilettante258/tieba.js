import { test, describe, it } from "node:test";
import assert from "node:assert";
import {
  userPostReqSerialize,
  userPostResDeserialize,
  postReqSerialize,
  postResDeserialize,
  threadReqSerialize, threadResDeserialize
} from "../src/ProtobufParser";
import {postProtobuf} from "../src/utils";

describe("ProtobufParser", () => {
  // it("userPostReq", async () => {
  //   let payload = await userPostReqSerialize(5991323492, 1);
  //   let correct = Buffer.from('0a1708e4aef1a8162801d00101da01091207382e392e382e35','hex');
  //   assert.strictEqual(payload.toString(), correct.toString());
  // });
  //
  // it("userPostRes", async () => {
  //   const buffer = await userPostReqSerialize(5991323492, 1);
  //   let responseData = await postProtobuf('/c/u/feed/userpost?cmd=303002', buffer);
  //   let result= await userPostResDeserialize(responseData);
  //   // assert(result.length > 0);
  // });

  it("postReq", async () => {
    const params = {
      tid: 9184321095,
      page: 2,
    };
    let payload = await postReqSerialize(params);
  });

  it("postRes", async () => {
    const params = {
      tid: 9184321095,
      page: 2,
    };
    let buffer = await postReqSerialize(params);
    let responseData = await postProtobuf('/c/f/pb/page?cmd=303002', buffer);
    let result= await postResDeserialize(responseData);
    console.dir(result)
  });

  // it("threadReq", async () => {
  //   const params = {
  //     fname: 'v',
  //     page: 2,
  //   };
  //   let payload = await threadReqSerialize(params);
  // });
  //
  // it("threadRes", async () => {
  //   const params = {
  //     fname: 'v',
  //     page: 2,
  //   };
  //   let buffer = await threadReqSerialize(params);
  //   let responseData = await postProtobuf('/c/f/frs/page?cmd=303002', buffer);
  //   let result= await threadResDeserialize(responseData);
  // });

});
