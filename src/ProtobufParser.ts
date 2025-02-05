import { Buffer } from "node:buffer";
import { tbclient as decode } from "./pb-gen/decode.js";
import { tbclient as encode } from "./pb-gen/encode.js";

type Concrete<Type> = {
	[Prop in keyof Type]-?: NonNullable<Type[Prop]>;
};

type DeepConcrete<Type> = {
	[Prop in keyof Type]-?: Type[Prop] extends object
		? DeepConcrete<NonNullable<Type[Prop]>>
		: NonNullable<Type[Prop]>;
};

export function userPostReqSerialize(uid: number, pn: number) {
	const Proto = encode.UserPostReqIdl;
	const payload = {
		data: {
			needContent: 1,
			userId: uid,
			pn: pn,
			common: {
				_clientVersion: "8.9.8.5",
			},
		},
	};
	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function userPostResDeserialize(buffer: Uint8Array) {
	const Proto = decode.UserPostResIdl;
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data.postList;
	}
}

export function forumReqSerialize(forumId: number) {
	const Proto = encode.GetForumDetailReqIdl;
	const payload = {
		data: {
			forumId: forumId,
			common: {
				_clientVersion: "12.64.1.1",
			},
		},
	};
	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function forumResDeserialize(buffer: Uint8Array) {
	const Proto = decode.GetForumDetailResIdl;
	const decoded: decode.IGetForumDetailResIdl = Proto.decode(buffer).toJSON();
	if (decoded?.error?.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		const data = decoded?.data
			?.forumInfo as Concrete<decode.GetForumDetailResIdl.DataRes.IRecommendForumInfo>;
		return data.forumName;
	}
}

export type postReq = {
	tid: number;
	page?: number;
	rn?: 1 | 2 | 3;
	sort?: number;
	onlyThreadAuthor?: boolean;
	withComment?: boolean;
	commentRn?: number;
	CommentsSortByTime?: boolean;
};

export function postReqSerialize(params: postReq) {
	const Proto = encode.PbPageReqIdl;
	const payload: DeepConcrete<encode.IPbPageReqIdl> = {
		data: {
			kz: params.tid,
			pn: params.page || 1,
			rn: params.rn || 30, //最大30
			// 1 时间倒序 2 热门排序 3及以上 时间正序
			r: params.sort || 3,
			lz: Number(params.onlyThreadAuthor || false),
			common: {
				_clientType: 2,
				_clientVersion: "12.64.1.1",
			},
		},
	};
	if (params.withComment) {
		// @ts-ignore
		payload.data.common.BDUSS = process.env.BDUSS;
		payload.data.withFloor = Number(true);
		payload.data.floorSortType = Number(!params.CommentsSortByTime);
		payload.data.floorRn = Number(params.commentRn || "4");
	}

	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function postResDeserialize(buffer: Uint8Array) {
	const Proto = decode.PbPageResIdl;
	const decoded = Proto.decode(buffer).toJSON();
	if (decoded?.error?.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data;
	}
}

export type threadReq = {
	fname: string;
	page?: number;
	rn?: number;
	sort?: 1 | 2 | 3 | 4 | 5;
	OnlyGood?: boolean;
};

export function threadReqSerialize(params: threadReq) {
	const Proto = encode.FrsPageReqIdl;
	const payload = {
		data: {
			kw: params.fname,
			pn: params.page || 1,
			rn: 105,
			rnNeed: params.rn ? Math.max(params.rn, 30) : 30, // 最大100
			isGood: Number(params.OnlyGood !== undefined ? params.OnlyGood : false),
			// 对于有热门分区的贴吧 0热门排序(HOT) 1按发布时间(CREATE) 2关注的人(FOLLOW) 34热门排序(HOT) >=5是按回复时间(REPLY)
			// 对于无热门分区的贴吧 0按回复时间(REPLY) 1按发布时间(CREATE) 2关注的人(FOLLOW) >=3按回复时间(REPLY)
			sortType: params.sort || 1,
			common: {
				_clientType: 2,
				_clientVersion: "12.64.1.1",
			},
		},
	};
	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function threadResDeserialize(buffer: Uint8Array) {
	const Proto = decode.FrsPageResIdl;
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data;
	}
}

export function getUserByUidReqSerialize(uid: number) {
	const Proto = encode.GetUserByUidReqIdl;
	const payload = {
		data: {
			tiebaUid: uid.toString(),
			common: {
				_clientType: 2,
				_clientVersion: "12.64.1.1",
			},
		},
	};
	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function getUserByUidResDeserialize(buffer: Uint8Array) {
	const Proto = decode.GetUserByUidResIdl;
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data.user;
	}
}

export function getProfileReqSerialize(uid: number, page?: number) {
	const Proto = encode.ProfileReqIdl;
	const payload = {
		data: {
			uid: uid,
			need_post_count: 1,
			pn: page || 1,
			common: {
				_clientType: 2,
				_clientVersion: "12.64.1.1",
			},
		},
	};
	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function getProfileResDeserialize(buffer: Uint8Array) {
	const Proto = decode.ProfileResIdl;
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data;
	}
}
