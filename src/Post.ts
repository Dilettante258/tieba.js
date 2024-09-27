import {postReq, postReqSerialize, postResDeserialize} from "./ProtobufParser";
import {postProtobuf} from "./utils";

async function getPostPipeline(params: postReq) {
  let buffer = await postReqSerialize(params);
  let responseData = await postProtobuf('/c/f/pb/page?cmd=303002', buffer);
  return await postResDeserialize(responseData);
}


export async function getPost(tid: number, page: number|'ALL'): Promise<any>;
export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor: boolean, withComment: boolean): Promise<any>;
export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor: boolean, withComment: boolean, commentParams: { commentRn: number, commentsSortByTime: boolean }): Promise<any>;


export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor?: boolean, withComment?: boolean, commentParams?: { commentRn: number, commentsSortByTime: boolean }): Promise<any> {
  const func = (pg: number) => {
    if(onlyThreadAuthor === undefined) {
      return getPostPipeline({ tid, page: pg });
    } else if (withComment === false) {
      return getPostPipeline({ tid, page: pg, onlyThreadAuthor });
    } else {
      return getPostPipeline({ tid, page: pg, withComment, ...(commentParams || {}), onlyThreadAuthor });
    }
  };
  if (page === 'ALL') {
    // TODO: 支持多页
    return Promise.all(Array.from({ length: 30 }, (_, i) => func(i + 1)));
  } else {
    return func(page);
  }
}


