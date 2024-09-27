import {userPostReqSerialize, userPostResDeserialize} from "./ProtobufParser";
import {postProtobuf} from "./utils";

const UPAPI = '/c/u/feed/userpost?cmd=303002'

async function pipeline(uid: number, pn: number) {
  const buffer = await userPostReqSerialize(uid, pn);
  let responseData = await postProtobuf(UPAPI, buffer);
  if (responseData.byteLength < 200) {
    console.error('Fetch failed');
  }
  return await userPostResDeserialize(responseData);
}


export async function getRawUserPost(uid: number, pn: number) {
  return await pipeline(uid, pn);
}

async function getUserPost(uid: number, pn: number): Promise<any>;
async function getUserPost(uid: number, from: number, to: number):Promise<any>;

async function getUserPost(uid: number, param2: number, param3?: number): Promise<any> {
  if (param3 === undefined) {
    return await pipeline(uid, param2);
  } else {
    const promises: Array<Promise<Buffer>> = [];
    for (let i = Number(param2); i <= Number(param3); i++) {
      promises.push(userPostReqSerialize(uid, i));
    }
    const buffers = await Promise.all(promises);
    return await Promise.all(buffers.map(buffer => postProtobuf('/c/u/feed/userpost?cmd=303002', buffer)))
      .then(res => res.map(res => userPostResDeserialize(res))).then(res => res.flat());
  }
}

