import {describe, it} from "node:test";
import {condenseProfile, getHiddenLikeForum} from "../src";


describe("User", () => {
  // it("getUserInfo", async () => {
  //   const uid = await getUserInfo('老葡秋');
  //   console.log(uid)
  //   const data = await getLikeForum(1923345098);
  //   console.log(data)
  // });

  // it("getUserByUid", async () => {
  //   const data = await getUserByUid(30861022);
  //   console.dir(data)
  // });
  // it("getProfile", async () => {
  //   const data = await getProfile(458523362);
  //   console.dir(data)
  // });
  // it("getPanel", async () => {
  //   const data = await getPanel('叫我老冰就好了');
  //   console.dir(data)
  // });
  // it("getFan", async () => {
  //   const data = await getLikeForum(5991323492);
  //   console.dir(data)
  // });
  // it("getUnameFromId", async () => {
  //   const data = await getUnameFromId(5991323492);
  //   console.dir(data)
  // });
  it("getUnameFromId", async () => {
    const data = await condenseProfile(5991323492);
    console.dir(data)
    const data2 = await getHiddenLikeForum(5991323492);
    console.dir(data)
  });

});
