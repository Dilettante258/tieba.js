import type { FirstPostContent } from "./Forum.js";

export interface UserInfo {
	no: number;
	error: string;
	data: {
		name: string;
		identity: number;
		name_show: string;
		show_nickname: string;
		profession_manager_nick_name: string;
		iconinfo: null;
		new_iconinfo: unknown;
		bg_id: number;
		portrait: string;
		portrait_h: string;
		portrait_time: number;
		sex: string;
		tb_age: number;
		post_num: number;
		honor: Honor;
		can_followed: number;
		is_block: number;
		is_private: number;
		mParr_props: any[];
		tbmall_month_icon: null;
		free_flag: null;
		marriage: any[];
		vipInfo: any[];
		tb_vip: boolean;
		followed_count: number;
	};
}

export interface UserPanel {
	name: string;
	identity: number;
	name_show: string;
	show_nickname: string;
	profession_manager_nick_name: string;
	iconinfo: Iconinfo[] | null;
	new_iconinfo: { [key: string]: any[] | NewIconinfoClass };
	bg_id: number;
	portrait: string;
	portrait_h: string;
	portrait_time: number;
	sex: string;
	tb_age: string;
	post_num: number;
	honor: Honor;
	can_followed: number;
	is_block: number;
	is_private: number;
	mParr_props: MParrProps | [];
	tbmall_month_icon: { [key: string]: number } | null;
	free_flag: null;
	marriage: any[];
	vipInfo: VipInfo | [];
	tb_vip: boolean;
	followed_count: number;
}

export interface NewIconinfoClass {
	slot_no: string;
	slot_type: string;
	icon: string;
	value: string;
	end_time: string;
	name: string;
	weight: number;
	position: Position;
	terminal: Terminal;
	sprite: Sprite;
	category_id: number;
	type: number;
	price: number;
	is_force: number;
	is_advanced: number;
	title: string;
	title_url: string;
	intro: string;
	intro_url: string;
	forum_list: string;
	pay_pic_pc: string;
	pay_pic_pad: string;
	level_1: Level;
}

export interface Honor {
	manager: Manager;
	grade: { [key: string]: Grade };
	novice: number;
}

export interface Manager {
	manager?: Grade;
	assist?: Grade;
}

export interface Grade {
	count: number;
	forum_list: string[];
}

export interface Iconinfo {
	icon: string;
	name: string;
	position: Position;
	sprite: Sprite;
	terminal: Terminal;
	value: number;
	weight: number;
}

export interface Sprite {
	"1": string;
}

export interface Level {
	icon_3: string;
	icon_2: string;
	icon_1: string;
	icon_5: string;
	icon_4: string;
	icon_6: string;
	level_info: LevelInfo;
}

export interface MParrProps {
	achievement: Achievement;
	all_level: { [key: string]: AllLevelItem };
	level: Level;
}

export interface Achievement {
	description: null;
	end_time: string;
	example_url: string;
	props_id: string;
	title: string;
}

export interface AllLevelItem {
	end_time: string;
	level: number;
	pic_url: string;
	score_limit: number;
}

export interface LevelInfo {
	title: string;
	title_url: string;
	intro: string;
	intro_url: string;
	forum_list: string;
	pay_pic_pc: string;
	pay_pic_pad: string;
}

export interface Position {
	frs: number;
	pb: number;
	home: number;
	card: number;
}

export interface VipInfo {
	a_score: number;
	e_time: string;
	ext_score: string;
	icon_url: string;
	icon_url_new: string;
	n_score: string;
	s_time: string;
	v_level: string;
	v_status: string;
}

export interface Terminal {
	pc: number;
	wap: number;
	client: number;
}

export interface FanRes {
	page: Page;
	user_list: RelativeUserList[];
	tips_text: string;
	follow_list_switch: string;
	server_time: string;
	time: number;
	ctime: number;
	logid: number;
	error_code: string;
}

export interface Page {
	page_size: string;
	offset: string;
	current_page: string;
	total_count: string;
	total_page: string;
	has_more: string;
	has_prev: string;
}

export interface RelativeUserList {
	id: string;
	name: string;
	portrait: string;
	follow_time: string;
	follow_from: string;
	name_show: string;
	live_status: string;
	live_id: string;
	display_auth_type: string;
	work_creator_info: string;
	bazhu_grade?: BazhuGradeClass;
	priv_sets: PrivSets | string;
	intro: string;
	is_followed: string;
	is_friend: string;
	has_concerned: string;
	is_fans: string;
	is_new: string;
	god_info?: GodInfo;
	new_god_data?: GodInfo;
}

export interface BazhuGradeClass {
	desc: string;
	forum_id: string;
	level: string;
}

export interface GodInfo {
	apply_source: string;
	field: string;
	field_name: string;
	level_1_dir: string[];
	status: string;
	update_time: string;
	field_id?: string;
}

export interface FollowRes {
	total_follow_num: number;
	logid: string;
	pn: number;
	has_more: number;
	tips_text: string;
	follow_list_switch: number;
	server_time: number;
	time: number;
	error_code: number;
	ctime: string;
	follow_list: FollowList[];
	error_msg: string;
}

export interface FollowList {
	ala_info?: AlaInfo;
	bazhu_grade: { desc?: string; level?: string };
	business_account_info: BusinessAccountInfo;
	display_auth_type: number;
	follow_from: string;
	has_concerned: number;
	id: number;
	intro: string;
	name?: string;
	name_show: string;
	new_god_data?: NewGodDataInFollowList;
	portrait: string;
	portraith: string;
	priv_sets: PrivSets;
	work_creator_info: WorkCreatorInfo;
}

export interface AlaInfo {
	anchor_live?: number;
	location: string;
	lng: number;
	lat: number;
}

export interface BusinessAccountInfo {
	is_business_account: number;
	is_forum_business_account: number;
}

export interface NewGodDataInFollowList {
	type_name: string;
	status: number;
	field_id: number;
	field_name: string;
	type: number;
}

export interface PrivSets {
	bazhu_show_inside?: number;
	bazhu_show_outside?: number;
	friend?: number;
	group?: number;
	like?: number;
	live?: number;
	location?: number;
	post?: number;
	reply?: number;
}

export interface WorkCreatorInfo {
	auth_desc: string;
}

export interface LikeForum {
	id: string;
	name: string;
	favo_type: string;
	level_id: string;
	level_name: string;
	cur_score: string;
	levelup_score: string;
	avatar: string;
	slogan: string;
}

export interface UserProfile {
	user: User;
	antiStat: AntiStat;
	postList: ProfilePostList[];
	userAgreeInfo: UserAgreeInfo;
}

export interface AntiStat {
	blockStat: number;
	hideStat: number;
	daysTofree: number;
}

export interface ProfilePostList {
	forumId: string;
	threadId: string;
	postId: string;
	createTime: number;
	forumName: string;
	title: string;
	userName: string;
	media?: Media[];
	replyNum: number;
	userId: string;
	userPortrait: string;
	threadType: string;
	freqNum: number;
	nameShow: string;
	shareNum: number;
	agree: Agree;
	isShareThread: number;
	firstPostContent: FirstPostContent[];
}

export interface Agree {
	agreeNum: string;
	hasAgree: number;
	agreeType: number;
	disagreeNum: string;
	diffAgreeNum: string;
}

export interface Media {
	type: number;
	smallPic: string;
	bigPic: string;
	waterPic: string;
	width: number;
	height: number;
	originPic: string;
}

export interface User {
	id: string;
	name: string;
	nameShow: string;
	portrait: string;
	iconinfo: Iconinfo[];
	fansNum: number;
	concernNum: number;
	sex: number;
	myLikeNum: number;
	intro: string;
	postNum: number;
	tbAge: string;
	privSets: PrivSets;
	likeForum: LikeForumPair[];
	vipInfo: VipInfo;
	isFans: number;
	newGodData: NewGodData;
	isDefaultAvatar: number;
	tiebaUid: string;
	ipAddress: string;
	virtualImageInfo: VirtualImageInfo;
	userGrowth: UserGrowth;
}

export interface Iconinfo {
	name: string;
}

export interface LikeForumPair {
	forumName: string;
	forumId: string;
}

export interface NewGodData {
	status: number;
	fieldId: number;
	fieldName: string;
}

export interface UserGrowth {
	levelId: number;
}

export interface VirtualImageInfo {
	issetVirtualImage: number;
	personalState: PersonalState;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type PersonalState = {};

export interface UserAgreeInfo {
	totalAgreeNum: string;
}

export interface CondenseProfile {
	name: string;
	nickname: string;
	id: string;
	uid: string;
	portrait: string;
	fan: number;
	follow: number;
	sex: number;
	godData: string | undefined;
	ipAddress: string;
	userGrowth: number;
	totalAgreeNum: string;
	tbAge: string;
	postNum: string;
	tbVip: boolean;
	vip: {
		level: string;
		status: string;
		expireTime: number;
	};
	manager: Manager;
}

export interface HiddenLikeForum {
	grade: { [key: string]: Grade };
	plain: Array<string>;
}
