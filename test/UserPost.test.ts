import {describe, it} from "node:test";
import {getUserPost} from "../src/UserPost";

describe("UserPost", () => {
  it("userPostReq", async () => {
    let result = await getUserPost(2101378695, 2);
    console.dir(result)
  });
});
