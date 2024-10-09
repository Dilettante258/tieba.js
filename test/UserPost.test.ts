import {describe, it} from "node:test";
import {getUserPost} from "../src/UserPost";

describe("UserPost", () => {
  it("userPostReq", async () => {
    let result = await getUserPost(5991323492, 1, 2);
    console.dir(result)
  });
});
