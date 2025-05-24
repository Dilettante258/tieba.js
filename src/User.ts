import { Effect, Either, pipe } from "effect";
import {
	getProfileReqSerialize,
	getProfileResDeserialize,
	getUserByUidReqSerialize,
	getUserByUidResDeserialize,
} from "./ProtobufParser.js";
import type {
	FanRes,
	FollowRes,
	LikeForum,
	Manager,
	UserInfo,
	UserPanel,
	UserProfile,
} from "./types/User.js";
import {
	checkResBuffer,
	getData,
	packRequest,
	postFormData,
	postProtobuf,
} from "./utils/index.js";

class FetchError {
	readonly _tag = "FetchError";
	constructor(readonly error: unknown) {}
}

export function getUserInfo(username: string) {
	return getData<UserInfo>(`/i/sys/user_json?un=${username}&ie=utf-8`);
}

export function getUnameFromId(uid: number) {
	return Effect.gen(function* () {
		const myHeaders = new Headers();
		myHeaders.append("Cookie", `BDUSS=${process.env.BDUSS}`);
		const requestOptions = {
			method: "GET",
			headers: myHeaders,
			redirect: "follow",
		};
		const res = yield* getData<{
			errno: number;
			chatUser: { uname: string };
		}>(`/im/pcmsg/query/getUserInfo?chatUid=${uid}`, requestOptions);
		if (res.errno !== 0) {
			throw new FetchError("BDUSS失效！");
		}
		return res.chatUser.uname;
	});
}

export type UserInfoFromUid = {
	id: string;
	name: string;
	nameShow: string;
	portrait: string;
	intro: string;
	tbAge: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	newGodData: any;
	tiebaUid: string;
};

export function getUserByUid(uid: number) {
	return pipe(
		getUserByUidReqSerialize(uid),
		(buffer) => postProtobuf("/c/u/user/getUserByTiebaUid?cmd=309702", buffer),
		Effect.andThen((buffer) => {
			checkResBuffer(buffer);
			return Effect.succeed(getUserByUidResDeserialize(buffer));
		}),
	);
}

export function getProfile(id: number | string) {
	return pipe(
		getProfileReqSerialize(id),
		(buffer) => postProtobuf("/c/u/user/profile?cmd=303012", buffer),
		Effect.andThen((buffer) => {
			checkResBuffer(buffer);
			return Effect.succeed(getProfileResDeserialize(buffer) as UserProfile);
		}),
	);
}

export function getPanel(un: string) {
	return pipe(
		Effect.tryPromise(() =>
			fetch(`http://tiebac.baidu.com/home/get/panel?un=${un}`),
		),
		Effect.andThen((res) => Effect.tryPromise(() => res.json())),
		Effect.andThen((res) => Effect.succeed(res as UserPanel)),
	);
}

export function getFan(id: number, page: number | "needAll" = 1) {
	return Effect.gen(function* () {
		const params = {
			uid: id.toString(),
			page: Number.isInteger(page) ? page.toString() : "1",
		};
		let res = yield* postFormData<FanRes>(
			"/c/u/fans/page",
			packRequest(params),
		);

		if (page === "needAll" && res.page.total_page !== "1") {
			const promises: Array<Effect.Effect<FanRes, FetchError>> = [];
			for (let i = 2; i <= Number(res.page.total_page); i++) {
				params.page = i.toString();
				promises.push(
					pipe(postFormData<FanRes>("/c/u/fans/page", packRequest(params))),
				);
			}
			const results = yield* Effect.all(promises, {
				concurrency: 5,
				mode: "either",
			});
			const successResults = results.filter((item) => Either.isRight(item));

			res = Object.assign(res, {
				user_list: [
					...res.user_list,
					...successResults.map((i) => i.right.user_list),
				],
			});

			res.user_list
				.filter(
					(user) =>
						typeof user.bazhu_grade === "string" ||
						Array.isArray(user.bazhu_grade),
				)
				.map((user) => Object.assign(user, { bazhu_grade: undefined }));
			return res;
		}
		return res;
	});
}

export function getFollow(id: number, page: number | "needAll" = 1) {
	return Effect.gen(function* () {
		const params = {
			uid: id.toString(),
			page: Number.isInteger(page) ? page.toString() : "1",
		};
		let res = yield* postFormData<FollowRes>(
			"/c/u/follow/followList",
			packRequest(params),
		);

		if (page === "needAll" && res.has_more === 1) {
			const promises: Array<Effect.Effect<FollowRes, FetchError>> = [];
			for (let i = 2; i <= res.total_follow_num / 20 + 1; i++) {
				params.page = i.toString();
				promises.push(
					pipe(
						postFormData<FollowRes>(
							"/c/u/follow/followList",
							packRequest(params),
						),
					),
				);
			}
			const results = yield* Effect.all(promises, { concurrency: 5 });

			res = Object.assign(res, {
				follow_list: [...res.follow_list, ...results.map((i) => i.follow_list)],
			});
		}
		return res;
	});
}

export function getLikeForum(
	id: number,
	page: number | "needAll" = 1,
): Effect.Effect<LikeForum[], FetchError> {
	return Effect.gen(function* () {
		const params = {
			friend_uid: id.toString(),
			page_no: Number.isInteger(page) ? page.toString() : "1",
			page_size: "400",
		};
		const res = yield* postFormData<{
			forum_list: { "non-gconforum": LikeForum[]; gconforum: LikeForum[] };
		}>("/c/f/forum/like", packRequest(params));
		if (res?.forum_list?.gconforum) {
			return res?.forum_list["non-gconforum"]?.concat(
				res?.forum_list?.gconforum,
			);
		}
		return res?.forum_list ? res?.forum_list["non-gconforum"] : [];
	});
}

export function condenseProfile(id: number) {
	return Effect.gen(function* () {
		const profile = yield* getProfile(id);
		const uid = profile.user.tiebaUid;
		const name = profile.user.name;
		const panel = yield* getPanel(name);
		const result: {
      name: string;
      nickname: string;
      id: string;
      uid: string;
      portrait: string;
      fan: number;
      follow: number;
      sex: number;
      godData: string;
      ipAddress: string;
      userGrowth: number;
      totalAgreeNum: string;
      tbAge: string;
      postNum: string;
      tbVip: boolean;
      vip?: {
        level: string;
        status: string;
        expireTime: number;
      }
      manager?: Manager;
  } = {
			name: name,
			nickname: profile.user.nameShow,
			id: profile.user.id,
			uid: uid,
			portrait: profile.user.portrait,
			fan: profile.user.fansNum,
			follow: profile.user.concernNum,
			sex: profile.user.sex,
			godData: profile.user.newGodData.fieldName,
			ipAddress: profile.user.ipAddress,
			userGrowth: profile.user.userGrowth.levelId,
			totalAgreeNum: profile.userAgreeInfo.totalAgreeNum,
			tbAge: profile.user.tbAge,
			postNum: String(profile.user.postNum),
			tbVip: panel.tb_vip,
		};
		if (panel.vipInfo) {
			result.vip = {
				level: "v_level" in panel.vipInfo ? panel.vipInfo.v_level : "0",
				status: "v_status" in panel.vipInfo ? panel.vipInfo.v_status : "0",
				expireTime:
					"e_time" in panel.vipInfo ? Number(panel.vipInfo.e_time) : 0,
			};
		}
		if (panel.honor?.manager) {
			result.manager = panel.honor.manager;
		}
		return result;
	});
}

export function getHiddenLikeForum(id: number) {
	return Effect.gen(function* () {
		const profile = yield* getProfile(id);
		const name = profile.user.name;
		const panel = yield* getPanel(name);
		const temp1 = profile.user.likeForum.map((i) => i.forumName);
		const temp2 = Object.entries(panel.honor?.grade ?? {}).flatMap(
			([_, value]) => value.forum_list,
		);
		return {
			grade: panel.honor?.grade ?? {},
			plain: temp1.filter((item) => !temp2.includes(item)),
		};
	});
}
