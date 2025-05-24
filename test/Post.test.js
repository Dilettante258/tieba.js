import {describe, it} from "node:test";
import {collatePost, Config, getPost, consume} from "../dist/index.js";
import util from "node:util";

Config.init({
  bduss: process.env.BDUSS,
  needPlainText: true,
  timeFormat: Intl.DateTimeFormat("zh-CN", {})
});

describe("Post", () => {
  it("getPost", async () => {
    const result = await consume(getPost(8512477747, 1, false, true));
    const temp = collatePost(result.postList);
    // console.log(temp);
    // collatePost(result.postList).forEach(post => {
    //   console.log({
    //     id: post.id,
    //     authorId: post.authorId,
    //     time: post.time,
    //     content: post.content,
    //     ipAddress: result.userList.find((item: UserList)=>(item.id === post.authorId)).ipAddress
    //   })
  });
  it("getPost-ALL", async () => {
    let result = await consume(getPost(8512477747, 'ALL'));
  });
  it("export post with user-info", async () => {
    let result = await consume(getPost(8512477747, 'ALL'));
  })
});
