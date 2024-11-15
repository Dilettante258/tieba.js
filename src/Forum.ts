import {
  forumReqSerialize,
  forumResDeserialize,
  threadReq,
  threadReqSerialize,
  threadResDeserialize
} from "./ProtobufParser";
import {postProtobuf, processThread, baseUrl, packRequest} from "./utils";
import HTMLParser from 'node-html-parser';
import {ForumThreadRes} from "./types";

async function threadPipeline(params: threadReq): Promise<ForumThreadRes> {
  let buffer = await threadReqSerialize(params);
  let responseData = await postProtobuf('/c/f/frs/page?cmd=303002', buffer);
  return threadResDeserialize(responseData);
}

export async function getRawThread(params: threadReq) {
  return await threadPipeline(params);
}

export async function getThread(params: threadReq) {
  let threads = await threadPipeline(params);
  threads.threadList = threads.threadList.map(processThread)
  return threads;
}

export async function getThreadPid(params: threadReq) {
  let result = await threadPipeline(params);
  return result.threadList.map((item: any) => item.id);
}

let forumNameCache = {};

export async function getForumName(forumId: number) {
  if (forumNameCache[forumId]) {
    return forumNameCache[forumId];
  }
  const buffer = await forumReqSerialize(forumId);
  const res = await postProtobuf('/c/f/forum/getforumdetail?cmd=303021', buffer);
  if (res.byteLength < 200) {
    console.error("Error: 未找到吧！")
    return "error";
  }
  const forumName = await forumResDeserialize(res);
  forumNameCache[forumId] = forumName;
  return forumName;
}


export async function getForumInfoByID(forumId: number) {
  const buffer = await forumReqSerialize(forumId);
  const res = await postProtobuf('/c/f/forum/getforumdetail?cmd=303021', buffer);
  if (res.byteLength < 200) {
    console.error('Error: 未查询到吧信息，吧ID：' + forumId);
    return "!!!Error!!!";
  }
  return await forumResDeserialize(res);
}

export async function getForumMembers(forumName: string, page: number) {
  let url = new URL('/bawu2/platform/listMemberInfo', baseUrl);
  url.searchParams.append('word',forumName)
  url.searchParams.append('page',page.toString());
  url.searchParams.append('ie','utf-8');
  let res = await fetch(url).then((response) => response.arrayBuffer())
  const decoder = new TextDecoder("gbk");
  const resText = decoder.decode(res);
  const doc = HTMLParser.parse(resText);
  const data = doc.querySelectorAll('a.user_name').map((element) => {
    return {
      portrait: element.attributes.href.slice(14),
      username: element.attributes.title,
      nickname: element.innerText
    }
  })
  const page_data = {
    all: doc.querySelector('span.tbui_total_page')?.innerText,
    now: page,
    membersNumber: doc.querySelector('div.forum_info_section.member_wrap.clearfix.bawu-info > h1 > span.text')?.innerText
  }
  return {data, page_data}
}