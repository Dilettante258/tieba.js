import {describe, it} from "node:test";
import {getLikeForum, getUserInfo} from "../src";


describe("User", () => {
  it("getUserInfo", async () => {
    const uid = await getUserInfo('老葡秋');
    console.log(uid)
    const data = await getLikeForum(1923345098);
    console.log(data)
  });

  // getLikeForum
  // it("getUserByUid", async () => {
  //   const buffer = await GetUserByUidReqSerialize(443304357);
  //   const responseData = await postProtobuf('/c/u/user/getUserByTiebaUid?cmd=309702', buffer);
  //   console.log(responseData)
  //   const data = await GetUserByUidResDeserialize(responseData)
  //   console.log(data)
  // });
  // it("getProfile", async () => {
  //   const buffer = await getProfileReqSerialize(2669629059)
  //   const responseData = await postProtobuf('/c/u/user/profile?cmd=303012', buffer);
  //   console.log(responseData)
  //   const data = await getProfileResDeserialize(responseData)
  //   console.log(data)
  // });

  // it("GetUserByUid", async () => {
  //   let result = await GetUserByUid(443304357);
  //   console.dir(result)
  // });
});
