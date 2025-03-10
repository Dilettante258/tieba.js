import {describe, it} from "node:test";
import {
  condenseProfile,
  Config,
  getFan,
  getFollow,
  getHiddenLikeForum,
  getLikeForum,
  getPanel,
  getProfile,
  getUnameFromId,
  getUserByUid,
  getUserInfo
} from "../dist/index.js";

Config.init({
  bduss: process.env.BDUSS,
  needPlainText: true,
  timeFormat: Intl.DateTimeFormat("zh-CN", {})
});

describe("User", () => {
  it("getUserInfo", async () => {
    const uid = await getUserInfo('老葡秋');
    const data = await getLikeForum(1923345098);
  });

  it("getUserByUid", async () => {
    const data = await getUserByUid(30861022);
  });
  it("getProfile", async () => {
    const data = await getProfile(458523362);
  });
  it("getPanel", async () => {
    const data = await getPanel('叫我老冰就好了');
  });
  it("getLikeForum", async () => {
    const data = await getLikeForum(5991323492);
  });
  it("getFan", async () => {
    const data = await getFan(5991323492);
  });
  it("getFollow", async () => {
    const data = await getFollow(5991323492, "needAll");
  });
  it("getUnameFromId", async () => {
    const data = await getUnameFromId(5991323492);
  });
  it("getUnameFromId", async () => {
    const data = await condenseProfile(5991323492);
    const data2 = await getHiddenLikeForum(5991323492);
  });
});
