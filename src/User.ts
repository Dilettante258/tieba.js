import {GetUserByUidReqSerialize, GetUserByUidResDeserialize,} from "./ProtobufParser";
import {baseUrl, packRequest, postFormData, postProtobuf} from "./utils";

export async function getInfo(username: string) {
	const res = await fetch(baseUrl + `/i/sys/user_json?un=${username}&ie=utf-8`);
	try {
		const json = await res.json();
		return json;
	} catch (e) {
		console.error("User not found");
		return "User not found";
	}
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

export async function GetUserByUid(uid: number): Promise<UserInfoFromUid> {
	const buffer = await GetUserByUidReqSerialize(uid);
	const responseData = await postProtobuf(
		"/c/u/user/getUserByTiebaUid?cmd=309702",
		buffer,
	);
	return await GetUserByUidResDeserialize(responseData);
}

export async function getFan(uid: number, page?: number | "needAll") {
	const params = {
		uid,
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

export async function getFollow(uid: number, page?: number | "needAll") {
	const params = {
		uid,
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

export async function getLikeForum(uid: number, page?: number | "needAll") {
	const params = {
		uid,
		page_no: Number.isInteger(page) ? page : 1,
		page_size: 400,
	};
	const res = await postFormData("/c/f/forum/like", packRequest(params));
	if (!params.hasOwnProperty("raw")) {
		if (res?.forum_list?.gconforum) {
			return res?.forum_list["non-gconforum"]?.concat(
				res?.forum_list?.gconforum,
			);
		}
		return res?.forum_list ? res?.forum_list["non-gconforum"] : [];
	}
}
