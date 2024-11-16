import {describe, it} from "node:test";
import {getPost} from "../src/Post";
import {collatePost} from "../src/utils";


describe("Post", () => {
  it("getPost", async () => {
    const result = await getPost(9063205171, 1, false, true);
    console.dir(result);
    const temp = collatePost(result.postList);
    // collatePost(result.postList).forEach(post => {
    //   console.log({
    //     id: post.id,
    //     authorId: post.authorId,
    //     time: post.time,
    //     content: post.content,
    //     ipAddress: result.userList.find((item: UserList)=>(item.id === post.authorId)).ipAddress
    //   })
    // });
  })
  // it("getPost-ALL", async () => {
  //   let result = await getPost(8512477747, 'ALL');
  //   console.log(1)
  // });
  // it("export post with user-info", async () => {
  //   let result = await getPost(8512477747, 'ALL');
  //   console.dir(result);
  // });
});
