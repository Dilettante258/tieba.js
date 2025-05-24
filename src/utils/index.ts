import { Effect, pipe, Schedule } from "effect";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { forumReqSerialize, forumResDeserialize } from "../ProtobufParser.js";
import type {
	FirstPostContent,
	OutputPostList,
	PostList,
	PostListContent,
	RawUserPost,
	Thread,
	UserPost,
} from "../types/index.js";
import { Cache, Duration } from "effect";
import { type Dispatcher, request } from "undici";
import { FormData } from "undici";

export const baseUrl = "http://tiebac.baidu.com";

export class ConfigError {
	readonly _tag = "ConfigError";
	constructor(readonly error: string) {}
}

export class FetchError {
	readonly _tag = "FetchError";
	constructor(readonly error: unknown) {}
}

export class InvaildResponseError {
	readonly _tag = "InvaildResponseError";
	constructor(readonly error: unknown) {}
}

export class IllegalParameterError {
	readonly _tag = "IllegalParameterError";
	constructor(readonly error: unknown) {}
}

export function checkResBuffer(buffer: Buffer) {
	if (buffer.byteLength > 200) {
		return Effect.fail(new InvaildResponseError("Fetch failed"));
	}
}

type initType = {
	bduss?: string;
	needPlainText?: boolean;
	needTimestamp?: boolean;
	timeFormat?: Intl.DateTimeFormat;
};

export class Config {
	static instance: Config;
	needPlainText!: boolean;
	needTimestamp!: boolean;
	timeFormat!: Intl.DateTimeFormat;

	private constructor() {}

	private _bduss!: string;

	get bduss() {
		return this._bduss;
	}

	public static init({
		bduss = undefined,
		needPlainText = true,
		needTimestamp = false,
		timeFormat = Intl.DateTimeFormat("zh-CN", {
			timeStyle: "short",
			dateStyle: "short",
		}),
	}: initType) {
		if (Config.instance) {
			throw new ConfigError("Config实例已经被初始化了。");
		}
		Config.instance = new Config();

		if ((bduss ?? process.env.BDUSS) === undefined) {
			throw new ConfigError(
				"未显式定义BDUSS，且BDUSS环境变量未设置!无法正常初始化。",
			);
		}
		Config.instance._bduss = (bduss ?? process.env.BDUSS) as string;
		Config.instance.needPlainText =
			needPlainText ?? process.env.NEED_PLAIN_TEXT?.toLowerCase() !== "false";
		Config.instance.needTimestamp =
			needTimestamp ?? process.env.NEED_TIMESTAMP?.toLowerCase() !== "false";
		Config.instance.timeFormat = timeFormat;
	}

	public static getInstance(): Config {
		if (!Config.instance) {
			throw new ConfigError("配置实例尚未初始化。请先调用init()。");
		}
		return Config.instance;
	}
}

export const requestWithRetry = (
	url: string,
	requestOptions: Parameters<typeof request>[1] = { method: "GET" },
	getBody: keyof Dispatcher.BodyMixin = "arrayBuffer",
	retries = 3,
	delay = 1000,
) => {
	const urlObj = new URL(url, url.startsWith("http") ? undefined : baseUrl);
	return Effect.tryPromise({
		try: () =>
			request(urlObj, requestOptions).then((res) => {
				if (res.statusCode >= 400) {
					return new FetchError(res.statusCode.toString());
				}
				return res.body;
			}),
		catch: (unknown) => Effect.fail(unknown),
	}).pipe(
		Effect.andThen(async (body) => {
			if (!(body instanceof FetchError)) {
				switch (getBody) {
					case "json":
						// biome-ignore lint/suspicious/noExplicitAny: <explanation>
						return (await body.json()) as any;
					case "arrayBuffer":
						return (await body.arrayBuffer()) as ArrayBuffer;
					default:
						return (await body.text()) as string;
				}
			}
			return body;
		}),
		Effect.retry({
			schedule: Schedule.exponential(delay),
			times: retries,
		}),
		Effect.catchAll((error) => Effect.fail(new FetchError(error))),
	);
};

export function getData<T>(
	url: string,
	requestOptions: Parameters<typeof request>[1] = {},
): Effect.Effect<T, FetchError> {
	return requestWithRetry(url, requestOptions, "json");
}

export function postFormData<T>(
	url: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any,
): Effect.Effect<T, FetchError> {
	return requestWithRetry(
		url,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: data,
		},
		"json",
	);
}

export function postProtobuf(url: string, buffer: Buffer) {
	return pipe(
		new Blob([buffer]),
		(blob) => {
			const data = new FormData();
			data.set("data", blob);
			return data;
		},
		(data) =>
			requestWithRetry(
				baseUrl + url,
				{
					method: "POST",
					headers: {
						x_bd_data_type: "protobuf",
					},
					body: data,
				},
				"arrayBuffer",
			),
		(buffer) => {
			return buffer;
		},
		Effect.andThen(Buffer.from),
	);
}

export function packRequest(
	data: ConstructorParameters<typeof URLSearchParams>[number],
) {
	const params = new URLSearchParams(data);
	const config = Config.getInstance();
	const defaultBDUSS = config.bduss;
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
		.update(`${string}tiebaclient!!!`)
		.digest("hex")
		.toUpperCase();
	params.append("sign", sign);
	return Array.from(params.entries())
		.map((entry) => entry.join("="))
		.join("&");
}

export function processUserPosts(posts: RawUserPost[], needForumName = false) {
	if (posts === undefined) {
		return Effect.succeed([]);
	}
	return Effect.gen(function* () {
		const result: UserPost[] = [];
		const config = Config.getInstance();
		const needTimestamp = config.needTimestamp;
		const timeFormat = config.timeFormat;

		if (needForumName) {
			const forumCache = yield* Cache.make({
				capacity: 100,
				timeToLive: Duration.infinity,
				lookup: (id: string) => getForumName(Number(id)),
			});

			const forumIDList = [...new Set(posts.map((post) => post.forumId))];
			yield* Effect.all(
				forumIDList.map((id) => forumCache.get(id)),
				{ concurrency: 5 },
			);

			for (const post of posts) {
				const forumName_ = needForumName
					? ((yield* forumCache.get(post.forumId)) as string)
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
						createTime: needTimestamp
							? content.createTime
							: timeFormat.format(new Date(Number(content.createTime) * 1000)),
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
		}
		return result;
	});
}

export function processContent(data: PostListContent[] | FirstPostContent[]) {
	return Effect.try({
		try: () => {
			const config = Config.getInstance();
			const needPlainText = config.needPlainText;

			let resultString = "";
			if (data === undefined) {
				return "";
			}
			for (const item of data) {
				switch (item.type) {
					case 0:
					case 9:
					case 18:
					case 27:
					case 40:
						resultString += item.text;
						break;
					case 1:
						resultString += needPlainText
							? `${item.text}`
							: `${item.text}#[链接]`;
						break;
					case 2:
					case 11:
						if (item.c === "升起") {
							resultString += "#(生气)";
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
						resultString += needPlainText ? " #[视频] " : "\n#[视频]\n";
						break;
					case 10:
						resultString += needPlainText ? " #[语音] " : "\n#[语音]\n";
						break;
					default:
						break;
				}
			}
			return resultString;
		},
		catch: (error) => new ConfigError(String(error)),
	});
}

export function collatePost(
	posts: PostList[],
	withComment = true,
): Effect.Effect<OutputPostList[], ConfigError> {
	return Effect.gen(function* () {
		const result: OutputPostList[] = [];
		for (const post of posts) {
			const content = yield* processContent(post.content);
			const signature = post?.signature
				? yield* processContent(post.signature.content)
				: undefined;

			const temp: OutputPostList = {
				...post,
				agree: {
					agreeNum: post.agree.agreeNum,
					disagreeNum: post.agree.disagreeNum,
				},
				signature,
				subPostList: undefined,
				content,
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
										content: processContent(subPost.content.slice(2))
											.pipe(Effect.map((c) => c.substring(2)))
											.pipe(Effect.runSync),
									};
								}
								return {
									id: subPost.id,
									time: subPost.time,
									authorId: subPost.authorId,
									content: processContent(subPost.content).pipe(Effect.runSync),
								};
							})
						: [];
			}
			result.push(temp);
		}
		return result;
	});
}

export function processThread(thread: Thread) {
	return pipe(
		processContent(thread.firstPostContent),
		Effect.map((content) => ({
			...thread,
			firstPostContent: content,
			voiceInfo: undefined,
			isVoiceThread: undefined,
			author: undefined,
			threadType: undefined,
		})),
	);
}

export function getForumName(forumId: number) {
	return pipe(
		Effect.tryPromise({
			try: async () => {
				const buffer = forumReqSerialize(forumId);
				const res = await postProtobuf(
					"/c/f/forum/getforumdetail?cmd=303021",
					buffer,
				).pipe(Effect.runPromise);
				if (res.byteLength < 200) {
					throw new FetchError("Error: 未找到吧！");
				}
				return forumResDeserialize(res);
			},
			catch: (error) => new FetchError(error),
		}),
		Effect.retry({
			times: 3,
			while: (error) => error._tag === "FetchError",
		}),
	);
}
