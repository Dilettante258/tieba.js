// import {describe, it} from "node:test";
// import {getPost} from "../src/Post";
// import {collatePost} from "../src/utils";
// import {UserList} from "../src/types";
//
// describe("Post", () => {
//   it("getPost", async () => {
//     let result = await getPost(8512477747, 1, false, true);
//     console.dir(result);
//     collatePost(result.postList).forEach(post => {
//       console.log({
//         id: post.id,
//         authorId: post.authorId,
//         time: post.time,
//         content: post.content,
//         ipAddress: result.userList.find((item: UserList)=>(item.id === post.authorId)).ipAddress
//       })
//     });
//   })
//   // it("getPost-ALL", async () => {
//   //   let result = await getPost(8512477747, 'ALL').then(console.log);
//   // });
//   // it("export post with user-info", async () => {
//   //   let result = await getPost(8512477747, 'ALL');
//   //   console.dir(result);
//   // });
// });
