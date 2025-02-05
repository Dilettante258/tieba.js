import {Buffer} from "buffer";
import {createHash} from "crypto";
import type {
  FirstPostContent,
  OutputPostList,
  PostList,
  PostListContent,
  RawUserPost,
  Thread,
  UserPost,
} from "../types/index.js";
import {forumReqSerialize, forumResDeserialize} from "../ProtobufParser.js";

export const baseUrl = "http://tiebac.baidu.com";
export const timeFormat = Intl.DateTimeFormat("zh-CN", {
  timeStyle: "short",
  dateStyle: "short",
});

let defaultBDUSS = "";
let needPlainText = false;

if (process.env.BDUSS) {
  defaultBDUSS = process.env.BDUSS;
  if (process.env.NEED_PLAIN_TEXT?.toLowerCase() !== "false") {
    needPlainText = true;
  }
} else {
  throw new Error("BDUSS环境变量未设置!");
}

export const fetchWithRetry = async (fetchFunction: Function, retries = 3, delay = 1000) => {
  try {
    return await fetchFunction();
  } catch (error) {
    if (retries > 0) {
      console.error(`请求失败，剩余重试次数：${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay)); // 等待一段时间后重试
      return fetchWithRetry(fetchFunction, retries - 1, delay);
    } else {
      throw new Error('请求失败，已达到最大重试次数');
    }
  }
};

export async function getData(url: string, requestOptions: RequestInit = {}) {
  const fetchFunction = () => fetch(baseUrl + url, requestOptions).then(response => response.json());
  return fetchWithRetry(fetchFunction).catch((error: Error) => {
    console.error("Fetch failed:", error);
    throw error;
  });
}

export async function postFormData(url: string, data: any) {
  const fetchFunction = () => fetch(baseUrl + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
  }).then(response => response.json());

  return fetchWithRetry(fetchFunction).catch((error: Error) => {
    console.error("Fetch failed:", error);
    throw error;
  });
}

export async function postProtobuf(url: string, buffer: Buffer) {
  const blob = new Blob([buffer]);
  const data = new FormData();
  data.append("data", blob);
  const fetchFunction = () => fetch(baseUrl + url, {
    method: "POST",
    headers: {
      x_bd_data_type: "protobuf",
    },
    body: data,
  }).then(response => response.arrayBuffer()).then(buffer => Buffer.from(buffer));
  return fetchWithRetry(fetchFunction).catch((error: Error) => {
    console.error("Fetch failed:", error);
    throw error;
  });
}

export function packRequest(data: any) {
  const params = new URLSearchParams(data);
  if (!params.has("BDUSS")) {
    params.append("BDUSS", defaultBDUSS);
  }
  if (!params.has("_client_version")) {
    params.append("_client_version", "12.57.4.2");
  }
  if (!params.has("pn")) {
    params.append("pn", params.get("page") || "1");
  }
  params.delete("page");
  params.sort();
  const string = Array.from(params.entries())
    .map((entry) => entry.join("="))
    .join("");
  const md5 = createHash("md5");
  const sign = md5
    .update(string + "tiebaclient!!!")
    .digest("hex")
    .toUpperCase();
  params.append("sign", sign);
  return Array.from(params.entries())
    .map((entry) => entry.join("="))
    .join("&");
}

export async function processUserPosts(
  posts: RawUserPost[],
  needForumName = false,
): Promise<UserPost[]> {
  const result: UserPost[] = [];
  for (const post of posts) {
    const forumName_ = needForumName
      ? await getForumName(Number(post.forumId))
      : "";
    for (const content of post.content) {
      const affiliated = content.postType === "1";
      const isReply = affiliated && content?.postContent[1]?.type === 4;
      result.push({
        forumId: Number(post.forumId),
        forumName: forumName_,
        title: post.title.slice(3),
        threadId: post.threadId,
        postId: post.postId,
        cid: content.postId,
        createTime: needPlainText
          ? timeFormat.format(new Date(Number(content.createTime) * 1000))
          : content.createTime,
        affiliated: affiliated,
        content: isReply
          ? content.postContent[2].text.slice(2)
          : content.postContent.length === 1
            ? content.postContent[0].text
            : content.postContent.map((item) => item.text).join(""),
        replyTo: isReply ? content.postContent[1].text : undefined,
      });
    }
  }
  return result;
}

export function processContent(data: PostListContent[] | FirstPostContent[]) {
  let resultString = "";
  if (data === undefined) {
    return "";
  }
  data.forEach((item) => {
    switch (item.type) {
      //[0, 9, 18, 27, 40]
      case 0:
      case 9:
      case 18:
      case 27:
      case 40:
        resultString += item.text;
        break;
      case 1:
        resultString += needPlainText ? `${item.text}` : `${item.text}#[链接]`;
        break;
      case 2:
      case 11:
        if (item.c === "升起") {
          resultString += `#(生气)`;
        } else {
          resultString += `#(${item.c})`;
        }
        break;
      case 3:
      case 20:
        resultString += needPlainText
          ? " #[图片] "
          : `\n#[图片](${item.cdnSrc})\n`;
        break;
      case 4:
        resultString += `${item.text}`;
        break;
      case 5:
        resultString += needPlainText ? " #[视频] " : `\n#[视频]\n`;
        break;
      case 10:
        resultString += needPlainText ? " #[语音] " : `\n#[语音]\n`;
        break;
      default:
        // 其他类型可以在这里处理，或者忽略
        break;
    }
  });
  return resultString;
}

export function collatePost(
  posts: PostList[],
  withComment = true,
): OutputPostList[] {
  const result: OutputPostList[] = [];
  for (const post of posts) {
    const temp: OutputPostList = {
      ...post,
      signature: post?.signature
        ? processContent(post.signature.content)
        : undefined,
      subPostList: undefined,
      content: processContent(post.content),
    };
    if (withComment && post.subPostList) {
      temp.subPostList =
        post.subPostNumber > 0
          ? post.subPostList.subPostList.map((subPost) => {
            if (
              subPost.content.length >= 3 &&
              subPost.content[1]?.uid !== undefined
            ) {
              return {
                id: subPost.id,
                time: subPost.time,
                authorId: subPost.authorId,
                otherName: subPost.content[1]?.text,
                otherId: subPost.content[1]?.uid,
                content: processContent(subPost.content.slice(2)).substring(
                  2,
                ),
              };
            } else {
              return {
                id: subPost.id,
                time: subPost.time,
                authorId: subPost.authorId,
                content: processContent(subPost.content),
              };
            }
          })
          : [];
    }
    result.push(temp);
  }
  return result;
}

export function processThread(thread: Thread) {
  const temp: any = {
    ...thread,
    firstPostContent: processContent(thread.firstPostContent),
  };
  delete temp.voiceInfo;
  delete temp.isVoiceThread;
  delete temp.author;
  delete temp.threadType;
  return temp;
}

const forumNameCache = {};

export async function getForumName(forumId: number) {
  if (forumNameCache[forumId]) {
    return forumNameCache[forumId];
  }
  const buffer = forumReqSerialize(forumId);
  const res = await postProtobuf(
    "/c/f/forum/getforumdetail?cmd=303021",
    buffer,
  );
  if (res.byteLength < 200) {
    console.error("Error: 未找到吧！");
    return "error";
  }
  const forumName = forumResDeserialize(res);
  forumNameCache[forumId] = forumName;
  return forumName;
}
