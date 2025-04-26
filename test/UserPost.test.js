import {describe, it} from "node:test";

import {getRawUserPost, getUserPost, Config, consume} from "../dist/index.js";

Config.init({
  bduss: process.env.BDUSS,
  needPlainText: true,
  timeFormat: Intl.DateTimeFormat("zh-CN", {})
});

describe("UserPost", () => {
  it("userPostReq", async () => {
    // const result1 = await getRawUserPost(5991323492, 2);
    // const result = await consume(getUserPost(5991323492, 2, true));
    // console.log(result);
    const result2 = await consume(getUserPost(5991323492, [50, 60], true));
    console.log(result2);
  });
});
