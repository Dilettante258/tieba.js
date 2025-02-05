import {
	getProfileReqSerialize,
	getProfileResDeserialize,
	getUserByUidReqSerialize,
	getUserByUidResDeserialize,
} from "./ProtobufParser.js";
import {baseUrl, getData, packRequest, postFormData, postProtobuf} from "./utils/index.js";
import {CondenseProfile, FanRes, FollowRes, HiddenLikeForum, LikeForum, UserPanel, UserProfile} from "./types/User.js";

export async function getUserInfo(username: string) {
	const res = await fetch(baseUrl + `/i/sys/user_json?un=${username}&ie=utf-8`);
	try {
		return await res.json();
	} catch (e) {
		console.error("User not found");
		return {error: "User not found"};
	}
}

export async function getUnameFromId(uid: number): Promise<string> {
	const myHeaders = new Headers();
	myHeaders.append("Cookie", `BDUSS=${process.env.BDUSS}`);
	const requestOptions: RequestInit = {
		method: "GET",
		headers: myHeaders,
		redirect: "follow"
	};

	const res = await getData(`/im/pcmsg/query/getUserInfo?chatUid=${uid}`, requestOptions)
	if (res.errno !== 0) {
		console.error('BDUSS失效！')
	}
	return res.chatUser.uname;
}

export type UserInfoFromUid = {
	id: string;
	name: string;
	nameShow: string;
	portrait: string;
	intro: string;
	tbAge: string;
	newGodData: any;
	tiebaUid: string;
};

export async function getUserByUid(uid: number): Promise<UserInfoFromUid> {
	const buffer = getUserByUidReqSerialize(uid);
	const responseData = await postProtobuf(
		"/c/u/user/getUserByTiebaUid?cmd=309702",
		buffer,
	);
	return await getUserByUidResDeserialize(responseData);
}

export async function getProfile(id: number): Promise<UserProfile> {
	const buffer = getProfileReqSerialize(id);
	const responseData = await postProtobuf(
		"/c/u/user/profile?cmd=303012",
		buffer,
	);
	return await getProfileResDeserialize(responseData);
}

export async function getPanel(un: string): Promise<UserPanel> {
	const data = await getData(`/home/get/panel?un=${un}`);
	return data.data;
}


export async function getFan(id: number, page?: number | "needAll"): Promise<FanRes> {
	const params = {
		uid: id,
		page: Number.isInteger(page) ? page : 1,
	};
	const res = await postFormData("/c/u/fans/page", packRequest(params));
	if (page === "needAll" && res.page.total_page !== "1") {
		for (let i = 2; i <= Number(res.page.total_page); i++) {
			params.page = i;
			const temp = await postFormData("/c/u/fans/page", packRequest(params));
			res.user_list.push(...temp.user_list);
		}
	}
	return res;
}

export async function getFollow(id: number, page?: number | "needAll"): Promise<FollowRes> {
	const params = {
		uid: id,
		page: Number.isInteger(page) ? page : 1,
	};
	const res = await postFormData("/c/u/follow/followList", packRequest(params));
	if (page === "needAll" && res.page.total_page !== "1") {
		const promises: Promise<any>[] = [];
		for (let i = 2; i <= res.total_follow_num / 20 + 1; i++) {
			params.page = i;
			promises.push(
				postFormData("/c/u/follow/followList", packRequest(params)),
			);
		}
		const results = await Promise.all(promises);
		results.forEach((result) => {
			res.follow_list.push(...result.follow_list);
		});
	}
	return res;
}

export async function getLikeForum(id: number, page?: number | "needAll"): Promise<LikeForum[]> {
	const params = {
		friend_uid: id,
		page_no: Number.isInteger(page) ? page : 1,
		page_size: 400,
	};
	const res = await postFormData("/c/f/forum/like", packRequest(params));
	if (res?.forum_list?.gconforum) {
		return res?.forum_list["non-gconforum"]?.concat(
			res?.forum_list?.gconforum,
		);
	}
	return res?.forum_list ? res?.forum_list["non-gconforum"] : [];
}

export async function condenseProfile(id: number): Promise<CondenseProfile> {
	const profile = await getProfile(id);
	const uid = profile.user.tiebaUid;
	const name = profile.user.name;
	const panel = await getPanel(name);
	return {
		name: name,
		nickname: profile.user.nameShow,
		id: profile.user.id,
		uid: uid,
		portrait: profile.user.portrait,
		fan: profile.user.fansNum,
		follow: profile.user.concernNum,
		sex: profile.user.sex,
		group: profile.user.privSets.group,
		godData: profile.user.newGodData.fieldName,
		ipAddress: profile.user.ipAddress,
		userGrowth: profile.user.userGrowth.levelId,
		totalAgreeNum: profile.userAgreeInfo.totalAgreeNum,
		tbAge: panel.tb_age,
		postNum: panel.post_num,
		tbVip: panel.tb_vip,
		vip: {
			level: "v_level" in panel.vipInfo ? panel.vipInfo.v_level : "0",
			status: "v_status" in panel.vipInfo ? panel.vipInfo.v_status : "0",
			expireTime: "e_time" in panel.vipInfo ? Number(panel.vipInfo.e_time) : 0
		},
		manager: panel.honor.manager,
	}
}

// 隐藏关注时使用该函数！只能获取一部分
export async function getHiddenLikeForum(id: number): Promise<HiddenLikeForum> {
	const profile = await getProfile(id);
	const name = profile.user.name;
	const panel = await getPanel(name);
	const temp1 = profile.user.likeForum.map((i) => i.forumName);
	const temp2 = Object.entries(panel.honor.grade)
		.map(([_, value]) => (value.forum_list)).flat();
	return {
		grade: panel.honor.grade,
		plain: temp1.filter(item => !temp2.includes(item)),
	}
}
