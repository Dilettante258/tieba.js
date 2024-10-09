import {userPostReqSerialize, userPostResDeserialize} from "./ProtobufParser";
import {postProtobuf, processUserPosts, UserPost} from "./utils";

const UPAPI = '/c/u/feed/userpost?cmd=303002'

async function pipeline(uid: number, pn: number) {
  const buffer = await userPostReqSerialize(uid, pn);
  let responseData = await postProtobuf(UPAPI, buffer);
  if (responseData.byteLength < 200) {
    console.error('Fetch failed');
  }
  return await userPostResDeserialize(responseData);
}


export async function getRawUserPost(uid: number, pn: number): Promise<RawUserPost[]> {
  return await pipeline(uid, pn);
}

export interface RawUserPost {
  forumId: string
  threadId: string
  postId: string
  createTime: number
  forumName: string
  title: string
  content: Content[]
  userName: string
  replyNum: number
  userId: string
  userPortrait: string
  threadType: string
  freqNum: number
  nameShow: string
}

export interface Content {
  postContent: PostContent[]
  createTime: string
  postType: string
  postId: string
}

export interface PostContent {
  type: number
  text: string
}

export async function getUserPost(uid: number, pn: number): Promise<UserPost>;
export async function getUserPost(uid: number, from: number, to: number): Promise<UserPost>;

export async function getUserPost(uid: number, param2: number, param3?: number): Promise<UserPost> {
  if (param3 === undefined) {
    const RawUserPost = await getRawUserPost(uid, param2);
    return await processUserPosts(RawUserPost, true);
  } else {
    const promises: Array<Promise<Buffer>> = [];
    for (let i = Number(param2); i <= Number(param3); i++) {
      promises.push(userPostReqSerialize(uid, i));
    }
    const RawUserPost = await Promise.all(promises)
      .then(buffers => {
        return Promise.all(buffers.map(buffer => postProtobuf('/c/u/feed/userpost?cmd=303002', buffer)));
      })
      .then(res => {
        return Promise.all(res.map(async res => {
          return await userPostResDeserialize(res);
        }));
      })
      .then(results => {
        return results.flat();
      })
    return await processUserPosts(RawUserPost, true);
  }
}

