import {describe, it} from "node:test";

import {getRawUserPost, getUserPost} from "../src/UserPost";


describe("UserPost", () => {
  it("userPostReq", async () => {
    const result1 = await getRawUserPost(5991323492, 2);
    console.dir(result1)
    const result = await getUserPost(5991323492, 2);
    console.dir(result)
  });
});
