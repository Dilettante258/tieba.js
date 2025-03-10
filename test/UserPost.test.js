import {describe, it} from "node:test";

import {getRawUserPost, getUserPost, Config} from "../dist/index.js";

Config.init({});

describe("UserPost", () => {
  it("userPostReq", async () => {
    // const result1 = await getRawUserPost(5991323492, 2);
    const result = await getUserPost(5991323492, 2, true);
  });
});
