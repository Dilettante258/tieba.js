import {describe, it} from "node:test";
import {getThreadPid} from "../dist/Forum.js";
import {Config} from "../dist/index.js";

const mainlandDivision = ["河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "内蒙古", "广西", "西藏", "宁夏", "新疆", "北京", "天津", "上海", "重庆"]
//ts-ignore
const specialDivision = ["中国台湾", "中国香港", "中国澳门"]

Config.init({});

describe("Forum", () => {
  // it("getRawThread", async () => {
  //   const temp = await getThread({
  //     fname: 'v',
  //     page: 1
  //   })
  // }),
  // it("getForumMembers", async () => {
  //   const data = await getForumMembers('文职人员', 121)
  //   console.log(data)
  // })
  it("getThreadPid", async () => {
    const temp = await getThreadPid({
      fname: 'v',
      page: 1
    })

  });
});
