import {describe, it} from "node:test";
import {baseUrl, packRequest} from "../src/utils";
import HTMLParser from 'node-html-parser';

const mainlandDivision = ["河北", "山西", "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "内蒙古", "广西", "西藏", "宁夏", "新疆", "北京", "天津", "上海", "重庆"]
//ts-ignore
const specialDivision = ["中国台湾", "中国香港", "中国澳门"]

describe("Forum", () => {
  // it("getRawThread", async () => {
  //   const temp = await getThread({
  //     fname: 'v',
  //     page: 1
  //   })
  // }),
  it("getForumMember", async () => {
    const params = {
      word: "江南造船厂",
      page: 1,
      ie: "utf-8",
    }
    const res = await fetch(baseUrl + '/bawu2/platform/listMemberInfo', {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: packRequest(params),
    }).then((response) => response.arrayBuffer())

    const decoder = new TextDecoder("gbk");
    const resText = decoder.decode(res);
    const doc = HTMLParser.parse(resText);

    console.log(doc)
    console.log(doc.querySelectorAll('a.user_name').map((element) => {
      return {
        portrait: element.attributes.href.slice(14),
        username: element.attributes.title,
        nickname: element.innerText
      }
    }))
  })
  // it("getThreadPid", async () => {
  //   const promises = Array.from({length: 10}, (_, i) => getThreadPid({
  //     fname: 'v',
  //     page: i + 1,
  //     sort: 5
  //   }));
  //   const temp = await Promise.all(promises);
  //   const pidList: Array<string> = [...new Set(temp.flat())]
  //   pidList.map(async (pid: string) => {
  //     const result = await getPost(Number(pid), 'ALL', false, true);
  //     collatePost(result.postList).forEach(post => {
  //       let ip = result.userList.find((item: UserList) => (item.id === post.authorId)).ipAddress;
  //       if (!mainlandDivision.includes(ip) && ip !== '') {
  //         console.log({
  //           id: post.id,
  //           authorId: post.authorId,
  //           time: timeFormat.format(new Date(post.time * 1000)),
  //           content: post.content,
  //           ipAddress: ip
  //         })
  //       }
  //     });
  //   })
  // });
});
