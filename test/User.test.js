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
  getUserInfo,
  consume
} from "../dist/index.js";

Config.init({
  bduss: process.env.BDUSS,
  needPlainText: true,
  timeFormat: Intl.DateTimeFormat("zh-CN", {})
});

describe("User", () => {
  it("getUserInfo", async () => {
    const uid = await consume(getUserInfo('老葡秋'));
    const data = await consume(getLikeForum(1923345098));
  });

  it("getUserByUid", async () => {
    const data = await consume(getUserByUid(30861022));
  });
  it("getProfile", async () => {
    const data = await consume(getProfile(458523362));
  });
  it("getPanel", async () => {
    const data = await consume(getPanel('Admire_02'));
    console.log(data);
  });
  it("getLikeForum", async () => {
    const data = await consume(getLikeForum(5991323492));
  });
  it("getFan", async () => {
    const data = await consume(getFan(5991323492));
  });
  it("getFollow", async () => {
    const data = await consume(getFollow(5991323492, "needAll"));
  });
  it("getUnameFromId", async () => {
    const data = await consume(getUnameFromId(5991323492));
  });
  it("getUnameFromId", async () => {
    const data = await consume(condenseProfile(5991323492));
    const data2 = await consume(getHiddenLikeForum(5991323492));
  });
});
