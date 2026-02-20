# tieba.js SDK

面向百度贴吧的数据获取与互动操作 SDK，基于 TypeScript + Effect，提供帖子、用户、贴吧、搜索、互动与管理相关能力。

- 文档（Typedoc）：http://sdk.eztb.org/
- npm：https://www.npmjs.com/package/tieba.js

## 安装

```bash
npm i tieba.js
# 或
pnpm add tieba.js
# 或
bun add tieba.js
```

> 当前仓库内工作区包名与 npm 发布包名一致，均为 `tieba.js`。

## 快速开始

```ts
import {
  TiebaClient,
  initClient,
  getThreads,
  getPosts,
  consume
} from "tieba.js";

// 1) 初始化客户端（必须）
initClient(
  new TiebaClient({
    bduss: process.env.BDUSS ?? ""
  })
);

// 2) 获取贴吧帖子列表
const threads = await consume(
  getThreads({
    fname: "v吧",
    page: 1,
    rn: 30,
    sort: 1
  })
);

// 3) 获取某个主题帖楼层
const posts = await consume(
  getPosts({
    tid: Number(threads?.threadList?.[0]?.id ?? 0),
    page: 1
  })
);

console.log(posts);
```

## 核心能力

- 贴吧：`getThreads`、`getForumDetail`、`getForumMembers`、`followForum`、`unfollowForum`、`signForum`
- 帖子：`getPosts`、`getComments`、`getUserPost`、`addPost`、`delPost`、`delThread`
- 用户：`getProfile`、`getUserByUid`、`getFans`、`getFollow`、`getLikeForum`、`followUser`、`unfollowUser`
- 搜索：`searchForum`、`searchPost`
- 互动：`agree`、`disagree`
- 管理：`goodThread`、`ungoodThread`、`topThread`、`untopThread`、`blockUser`、`unblockUser`

完整参数与返回结构请查看 Typedoc 文档：http://sdk.eztb.org/

## 为什么选择 tieba.js

- 函数式 API：所有接口基于 `Effect` 返回值，组合与并发控制更清晰，错误处理更统一。
- Tree-shaking 友好：采用 ESM + 按需命名导出，打包时可只保留你实际使用的 API。
- 高性能网络层：底层基于 `Undici`，并使用共享连接池与连接复用，减少重复建连开销。
- TypeScript 体验完善：完整类型定义覆盖请求参数与返回结构，减少接口调用时的运行时错误。
- Node/Bun 优先：在 Node.js 与 Bun 运行时可直接使用，适合服务端、脚本任务、Serverless 场景。

> 关于浏览器：SDK 当前默认基于 Undici 请求链路，主目标是服务端运行时（Node/Bun）。如需浏览器场景，建议通过你自己的后端 API 转发调用。

## Cloudflare Worker 兼容说明

`tieba.js` 发布包内置了 `dist/shims/undici.js`，用于 Cloudflare Worker 等非 Node 运行时的打包替换。

原因是 `undici` 当前主要面向 Node 运行时，且存在 CJS/Node 依赖路径；在 Worker 环境直接打包或运行时，可能因为 Node 专属能力缺失而失败。

Worker 构建时建议将 `undici` 别名到该 shim，例如：

```bash
esbuild ... --alias:undici=./node_modules/tieba.js/dist/shims/undici.js
```

Node/Bun 场景不需要此别名，默认继续使用 `undici` 即可。

## 错误处理

SDK 统一抛出 `TiebaError` 体系，常见包括：

- `FetchError`：网络层请求失败或超时
- `TiebaServerError`：贴吧接口业务错误（如 `errorno != 0`）
- `InvalidParamError`：参数不合法

```ts
import {
  consume,
  TiebaError,
  TiebaServerError,
  FetchError
} from "tieba.js";

try {
  // await consume(...)
} catch (err) {
  if (err instanceof TiebaServerError) {
    console.error("贴吧业务错误", err.code, err.message);
  } else if (err instanceof FetchError) {
    console.error("网络请求错误", err.message);
  } else if (err instanceof TiebaError) {
    console.error("SDK 错误", err.message);
  } else {
    console.error("未知错误", err);
  }
}
```

## 高级：自定义 Undici 连接策略

SDK 默认使用共享连接池。你也可以注入自己的 `dispatcher`：

```ts
import { Agent } from "undici";
import { setHttpDispatcher } from "tieba.js";

setHttpDispatcher(
  new Agent({
    connections: 64,
    pipelining: 1,
    connectTimeout: 10_000,
    keepAliveTimeout: 10_000
  })
);
```

## 相关链接

- Typedoc：http://sdk.eztb.org/
- npm：https://www.npmjs.com/package/tieba.js

## 友情链接

- aiotieba（Python 实现的贴吧 SDK）：https://github.com/lumina37/aiotieba/
