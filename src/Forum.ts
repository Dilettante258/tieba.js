import {threadReq, threadReqSerialize, threadResDeserialize} from "./ProtobufParser";
import {postProtobuf} from "./utils";

const params = {
  fname: 'v',
  page: 2,
};



async function threadPipeline(params: threadReq) {
  let buffer = await threadReqSerialize(params);
  let responseData = await postProtobuf('/c/f/frs/page?cmd=303002', buffer);
  return await threadResDeserialize(responseData);
}



export async function getRawThread(params: threadReq) {
  return await threadPipeline(params);
}

export async function getThreadPid(params: threadReq) {
  let result = await threadPipeline(params);
  return result.decoded.data.threadList.map((item:any) => item.id);
}

