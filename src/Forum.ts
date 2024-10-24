import {
  forumReqSerialize,
  forumResDeserialize,
  threadReq,
  threadReqSerialize,
  threadResDeserialize
} from "./ProtobufParser";
import {postProtobuf} from "./utils";

async function threadPipeline(params: threadReq) {
  let buffer = await threadReqSerialize(params);
  let responseData = await postProtobuf('/c/f/frs/page?cmd=303002', buffer);
  return threadResDeserialize(responseData);
}

export async function getRawThread(params: threadReq) {
  return await threadPipeline(params);
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
