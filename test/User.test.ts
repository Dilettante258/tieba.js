import {describe, it} from "node:test";
import {getProfileReqSerialize, getProfileResDeserialize} from "../src/ProtobufParser";
import {postProtobuf} from "../src";


describe("User", () => {
  // it("getUserByUid", async () => {
  //   const buffer = await GetUserByUidReqSerialize(443304357);
  //   const responseData = await postProtobuf('/c/u/user/getUserByTiebaUid?cmd=309702', buffer);
  //   console.log(responseData)
  //   const data = await GetUserByUidResDeserialize(responseData)
  //   console.log(data)
  // });
  it("getProfile", async () => {
    const buffer = await getProfileReqSerialize(2669629059)
    const responseData = await postProtobuf('/c/u/user/profile?cmd=303012', buffer);
    console.log(responseData)
    const data = await getProfileResDeserialize(responseData)
    console.log(data)
  });

  // it("GetUserByUid", async () => {
  //   let result = await GetUserByUid(443304357);
  //   console.dir(result)
  // });
});
