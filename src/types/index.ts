export interface PostRes {
  forum: Forum;
  page: Page;
  postList: PostList[];
  thread: Thread;
  userList: UserList[];
  threadFreqNum: string;
}

export interface Forum {
  id: string;
  name: string;
  firstClass: string;
  secondClass: string;
  memberNum: number;
  postNum: number;
}

export interface Page {
  pageSize: number;
  currentPage: number;
  totalPage: number;
  hasMore: number;
  hasPrev: number;
}

export interface PostList {
  id: string;
  floor: number;
  time: number;
  content: PostListContent[];
  subPostNumber: number;
  authorId: string;
  agree: Agree;
  subPostList?: PostListSubPostList;
  signature?: Signature;
}

export interface Agree {
  agreeNum: string;
  hasAgree: number;
  agreeType: number;
  disagreeNum: string;
  diffAgreeNum: string;
}

export interface PostListContent {
  type: number;
  text?: string;
  bsize?: string;
  cdnSrc?: string;
  bigCdnSrc?: string;
  originSrc?: string;
  originSize?: number;
  c?: string;
}

export interface Signature {
  content: SignatureContent[];
}

export interface SignatureContent {
  type: number;
  text: string;
}

export interface PostListSubPostList {
  subPostList: SubPostListElement[];
}

export interface SubPostListElement {
  id: string;
  content: SubPostListContent[];
  time: number;
  authorId: string;
  title: string;
  floor: number;
}

export interface SubPostListContent {
  type: number;
  text: string;
  c?: string;
  uid?: string;
}

export interface Thread {
  id: string;
  title: string;
  replyNum: number;
  author: Author;
  threadType: number;
  createTime: number;
  postId: string;
  agree: Agree;
  shareNum: number;
  originThreadInfo: OriginThreadInfo;
  isShareThread: number;
}

export interface Author {
  id: string;
  name: string;
  nameShow: string;
  portrait: string;
  iconinfo: Iconinfo[];
  levelId: number;
  isBawu: number;
  bawuType: string;
  fansNum: number;
  gender: number;
  privSets: AuthorPrivSets;
  newGodData: AuthorNewGodData;
  ipAddress: string;
  userGrowth: UserGrowth;
}

export interface Iconinfo {
  name: string;
}

export interface AuthorNewGodData {
  fieldId: number;
}

export interface AuthorPrivSets {
  location: number;
  like: number;
  group: number;
  live: number;
}

export interface UserGrowth {
  levelId: number;
}

export interface OriginThreadInfo {
  title: string;
  media: Media[];
  fname: string;
  tid: string;
  fid: string;
  content: OriginThreadInfoContent[];
  pollInfo: PollInfo;
}

export interface OriginThreadInfoContent {
  type: number;
  text: string;
  link: string;
  src: string;
  bsize: string;
  c: string;
  duringTime: number;
  uid: string;
  width: number;
  height: number;
  originSrc: string;
  originSize: number;
}

export interface Media {
  type: number;
  smallPic: string;
  bigPic: string;
  waterPic: string;
  width: number;
  height: number;
}

export interface PollInfo {
  isMulti: number;
  totalNum: string;
  totalPoll: string;
  title: string;
}

export interface UserList {
  id: string;
  name?: string;
  nameShow?: string;
  portrait: string;
  iconinfo?: Iconinfo[];
  levelId?: number;
  isBawu?: number;
  bawuType?: BawuType;
  fansNum?: number;
  gender?: number;
  privSets?: UserListPrivSets;
  newGodData?: UserListNewGodData;
  ipAddress?: string;
  userGrowth?: UserGrowth;
}

export enum BawuType {
  Assist = "assist",
  Empty = "",
}

export interface UserListNewGodData {
  fieldId: number;
  status?: number;
  fieldName?: string;
}

export interface UserListPrivSets {
  location?: number;
  like?: number;
  group?: number;
  live?: number;
  post?: number;
  friend?: number;
  reply?: number;
}
