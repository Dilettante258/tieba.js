import { test, describe, it } from "node:test";
import {getPost} from "../src/Post";

describe("ProtobufParser", () => {
    it("userPostReq", async () => {
      let result = await getPost(9190432571, 1);
      console.dir(result)
    });
});
