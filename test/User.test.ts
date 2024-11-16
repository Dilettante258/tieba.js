import {describe, it} from "node:test";
import {GetUserByUid} from "../src/User";
import {GetUserByUidReqSerialize, GetUserByUidResDeserialize} from "../src/ProtobufParser";
import {postProtobuf} from "../src/utils";

describe("User", () => {
  it("GetUserByUid", async () => {
    const buffer = await GetUserByUidReqSerialize(443304357);
    const responseData = await postProtobuf('/c/u/user/getUserByTiebaUid?cmd=309702', buffer);
    console.log(responseData)
    const data = await GetUserByUidResDeserialize(responseData)
    console.log(data)
  });

  // it("GetUserByUid", async () => {
  //   let result = await GetUserByUid(443304357);
  //   console.dir(result)
  // });
});
