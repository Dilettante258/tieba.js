import {describe, it} from "node:test";
import {getPost} from "../src/Post";

describe("Post", () => {
  it("getPost", async () => {
    console.info('begin')
    let result = await getPost(9190432571, 1).then(console.log);
    console.info('end')
      console.dir(result)
    });
});
