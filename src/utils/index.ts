// import {forumReqSerialize, forumResDeserialize} from "../ProtobufParser";
import {Buffer} from 'buffer';
import {createHash} from 'crypto';
import {RawUserPost} from "../UserPost";
import {getForumName} from "../Forum";

export const baseUrl = 'https://tiebac.baidu.com'
export const timeFormat = Intl.DateTimeFormat('zh-CN', {
  timeStyle: "short",
  dateStyle: "short",
});

let defaultBDUSS = "";

if (process.env.BDUSS) {
  defaultBDUSS = process.env.BDUSS;
} else {
  throw new Error("BDUSS环境变量未设置!")
}


export async function postFormData(url: string, data: any) {
  const response = await fetch(baseUrl + url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
  }).catch(error => {
    console.error('Fetch failed:', error);
  });
  if (response) {
    return await response.json();
  }
  throw new Error('Fetch failed');
}

export async function postProtobuf(url: string, buffer: Buffer) {
  let blob = new Blob([buffer]);
  let data = new FormData();
  data.append('data', blob);
  const response = await fetch(baseUrl + url, {
    method: "POST",
    headers: {
      'x_bd_data_type': 'protobuf',
    },
    body: data,
  }).catch(error => {
    console.error('Fetch failed:', error);
  });
  if (response) {
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  }
  throw new Error('Fetch failed');
}


export function packRequest(data: any) {
  let params = new URLSearchParams(data);
  if (!params.has('BDUSS')) {
    params.append('BDUSS', defaultBDUSS);
  }
  if (!params.has('_client_version')) {
    params.append('_client_version', '12.57.4.2');
  }
  if (!params.has('pn')) {
    params.append('pn', params.get('page') || '1');
  }
  params.delete('page');
  params.sort();
  const string = Array.from(params.entries()).map(entry => entry.join('=')).join('');
  const md5 = createHash('md5');
  const sign = md5.update(string + 'tiebaclient!!!').digest('hex').toUpperCase();
  params.append('sign', sign);
  return Array.from(params.entries()).map(entry => entry.join('=')).join('&');
}

export type UserPost = {
  forumId: number,
  forumName: string,
  title: string,
  threadId: string,
  postId: string,
  cid: string,
  createTime: string,
  affiliated: boolean,
  content: string,
  replyTo: string,
}

export async function processUserPosts(posts: RawUserPost[], needForumName = false): Promise<UserPost[]> {
  let result: UserPost[] = [];
  for (let post of posts) {
    const forumName_ = needForumName ? await getForumName(Number(post.forumId)) : '';
    for (let content of post.content) {
      let affiliated = content.postType === "1";
      let isReply = affiliated && content?.postContent[1]?.type === 4;
      result.push({
        forumId: Number(post.forumId),
        forumName: forumName_,
        title: post.title.slice(3),
        threadId: String(post.threadId),
        postId: String(content.postId),
        cid: String(content.postId),
        createTime: timeFormat.format(new Date(Number(content.createTime) * 1000)),
        affiliated: affiliated,
        content: (isReply) ?
          content.postContent[2].text.slice(2) :
          (content.postContent.length === 1 ?
              content.postContent[0].text : content.postContent.map(item => item.text).join('')
          ),
        replyTo: isReply ? content.postContent[1].text : "",
      });
    }
  }
  return result;
}
