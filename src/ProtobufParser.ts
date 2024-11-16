import {Buffer} from "buffer";
import {join} from "path";
import pbjs, {type Buffer as BufferType} from "protobufjs";

export async function userPostReqSerialize(uid: number, pn: number) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/UserPostReqIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("UserPostReqIdl");
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

export async function userPostResDeserialize(buffer: BufferType) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/UserPostResIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("UserPostResIdl");
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data.postList;
	}
}

export async function forumReqSerialize(forumId: number) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/Forum/GetForumDetailReqIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("GetForumDetailReqIdl");
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

export async function forumResDeserialize(buffer: BufferType) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/Forum/GetForumDetailResIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("GetForumDetailResIdl");
	const decoded = Proto.decode(buffer).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		const data = decoded.data.forumInfo;
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

export async function postReqSerialize(params: postReq) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetPosts/PbPageReqIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("PbPageReqIdl");
	const payload: any = {
		data: {
			kz: params["tid"],
			pn: params["page"] || 1,
			rn: params["rn"] || 30, //最大30
			// 1 时间倒序 2 热门排序 3及以上 时间正序
			r: params["sort"] || 3,
			lz: params["onlyThreadAuthor"] || false,
			common: {
				_clientType: 2,
				_clientVersion: "12.64.1.1",
			},
		},
	};
	if (params.withComment) {
		payload.data.common.BDUSS = process.env.BDUSS;
		payload.data.withFloor = true;
		payload.data.floorSortType = !params["commentsSortByTime"];
		payload.data.floorRn = params["commentRn"] || "4";
	}

	const message = Proto.create(payload);
	const buffer = Proto.encode(message).finish();
	return Buffer.from(buffer);
}

export function postResDeserialize(buffer: BufferType) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetPosts/PbPageResIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("PbPageResIdl");
	const decoded = Proto.decode(buffer).toJSON();
	if (decoded.error.errorno !== 0) {
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

export async function threadReqSerialize(params: threadReq) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetThreads/FrsPageReqIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("FrsPageReqIdl");
	const payload = {
		data: {
			kw: params.fname,
			pn: params.page || 1,
			rn: 105,
			rnNeed: params.rn ? Math.max(params.rn, 30) : 30, // 最大100
			isGood: params.OnlyGood !== undefined ? params.OnlyGood : false,
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

export async function threadResDeserialize(buffer: BufferType) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetThreads/FrsPageResIdl.proto"))
		.resolveAll();
	const Proto = root.lookupType("FrsPageResIdl");
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data;
	}
}

export async function GetUserByUidReqSerialize(uid: number) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetUserByUid/DataReq.proto"))
		.resolveAll();
	const Proto = root.lookupType("GetUserByUidReqIdl");
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

export async function GetUserByUidResDeserialize(buffer: BufferType) {
	const root = pbjs
		.loadSync(join(__dirname, "./proto/GetUserByUid/DataRes.proto"))
		.resolveAll();
	const Proto = root.lookupType("GetUserByUidResIdl");
	const decoded = Proto.decode(Buffer.from(buffer)).toJSON();
	if (decoded.error.errorno !== 0) {
		console.error(`${decoded.error}`);
	} else {
		return decoded.data.user;
	}
}
