import {postReq, postReqSerialize, postResDeserialize} from "./ProtobufParser";
import {postProtobuf} from "./utils";
import {util} from "protobufjs";


async function getPostPipeline(params: postReq) {
  let buffer = await postReqSerialize(params);
  let responseData = await postProtobuf('/c/f/pb/page?cmd=303002', buffer);
  return postResDeserialize(responseData);
}


export async function getPost(tid: number, page: number|'ALL'): Promise<any>;
export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor: boolean, withComment: boolean): Promise<any>;
export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor: boolean, withComment: boolean, commentParams: { commentRn: number, commentsSortByTime: boolean }): Promise<any>;


export async function getPost(tid: number, page: number|'ALL', onlyThreadAuthor?: boolean, withComment?: boolean, commentParams?: { commentRn: number, commentsSortByTime: boolean }): Promise<any> {
  const func = async (pg: number) => {
    if(onlyThreadAuthor === undefined) {
      console.log('debug')
      return await getPostPipeline({tid, page: pg});
    } else if (withComment === false) {
      return await getPostPipeline({tid, page: pg, onlyThreadAuthor});
    } else {
      return await getPostPipeline({tid, page: pg, withComment, ...(commentParams || {}), onlyThreadAuthor});
    }
  }
  if (page === 'ALL') {
    // func(1).then((data:any) => {console.log(data)})
    return Promise.all(Array.from({ length: 30 }, (_, i) => func(i + 1)));
  } else {
    func(page).then(console.log)
    return await func(page);
  }
}


