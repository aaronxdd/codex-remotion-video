# 此刻 · Current News

综合新闻聚合网站。默认连接 **中国新闻网、IT之家、联合国新闻** 的 11 个官方 RSS 订阅，覆盖国内、国际、财经、科技、社会、体育、文娱、健康、教育、生活。无需 API 密钥。

## 启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000。

## 功能

- 分类、来源、关键词与时间范围组合筛选。
- 新闻原文链接、来源摘要、发布时间；按发布时间排序与去重。
- 收藏到当前浏览器（最多 200 条），支持再次阅读。
- 页面每分钟检查，后端订阅缓存两分钟；手动刷新最短间隔 30 秒。
- 并发请求合并、12 秒来源超时、失败时保留本次运行期间的缓存。
- 来源面板分别显示获取时间、最新报道时间、连接或缓存状态。

“全部新闻”指所接入来源的新闻，不是互联网所有报道。新闻源自行决定发布频率，不能保证秒级实时；不会把获取时间当作新闻发布时间。失效订阅不会被模拟新闻替换。

## 数据服务选择

- 中国新闻网官方 RSS 目录：https://www.chinanews.com.cn/rss/
- IT之家：https://www.ithome.com/rss/
- 联合国新闻中文：https://news.un.org/feed/subscribe/zh/news/all/rss.xml
- NewsAPI 文档：https://newsapi.org/docs ，免费开发套餐有 24 小时延迟且不适用于生产，所以本项目未启用。
- 36氪订阅测试返回验证页面，未作为可用源接入。

只展示来源提供的标题、短摘要、图片和原文链接，不存储或重新发布文章全文。内容版权归原媒体所有；公开商业部署前需自行确认各来源的使用条款。

## 开发

`npm test` 验证 RSS / Atom 解析、时间处理、缓存、去重和失败状态。
`npm run typecheck` 检查类型；`npm run build` 构建页面。

- `news-service.mjs`：来源配置与聚合服务。
- `server.mjs`：本地服务，`GET /api/news` 和 `GET /api/health`。
- `src/news/`：新闻网站界面。

服务监听本机 `127.0.0.1:3000`，RSS 请求来自本机服务端，需要网络可访问来源。
# 财经子栏目、热点与站内阅读

财经支持“全部财经 / 财联社 / 中新网财经”。财联社取自公开首页热门资讯摘要，并非实时电报。
新闻标题进入本站 `/news/:id`，只展示来源摘要，不复制全文；原文链接为次要入口。浏览器保留最近 600 条摘要，超出当前来源范围且未缓存的链接会显示不可用。

热点入口为 `/hot`，财联社热门可直接使用。X 和 YouTube 为官方 API 可选接入：将 `.env.example` 复制为 `.env`，填写密钥后重启服务。密钥仅由服务端读取。
- X：`X_BEARER_TOKEN`，需具备 [趋势接口权限](https://docs.x.com/x-api/trends/trends-by-woeid/introduction)。
- YouTube：`YOUTUBE_API_KEY`，启用 YouTube Data API v3；[mostPopular](https://developers.google.com/youtube/v3/docs/videos/list) 为美国区域热门视频，当前覆盖音乐、影视、游戏，不是综合新闻榜。
- 微博：匿名热搜访问被拒绝，当前显示待接入授权数据服务，不提供虚构数据。

热点缓存 2 分钟；独立检查：`node --test upgrade.test.mjs`。
# GitHub Pages + 实时新闻 API

线上界面由 GitHub Pages 托管，新闻数据由 Cloudflare Worker 实时提供。Worker 在边缘节点缓存新闻和热点 2 分钟、正文 10 分钟，页面每分钟检查更新。GitHub Actions 每天生成一次静态快照作为 API 未配置或不可用时的部署回退；推送 main 或手动运行 Publish news snapshots 也会更新。
仓库 Settings → Pages → Source 选择 GitHub Actions。网址：https://aaronxdd.github.io/current-news/

## 部署 Cloudflare Worker

```bash
npx wrangler login
npm run worker:deploy
```

生产入口为 `https://xuyunxi.top/current-news/`，根路径会自动跳转到新闻站。Cloudflare Worker 缓存并代理 GitHub Pages 静态文件，同时在同一域名的 `/api/*` 提供实时新闻。备用 Worker 地址仍为 `https://current-news-api.current-news.workers.dev`。

热点密钥通过 Worker Secret 保存，不要写入仓库：

```bash
npx wrangler secret put X_BEARER_TOKEN
npx wrangler secret put YOUTUBE_API_KEY
```

这两个密钥均为可选。未配置时新闻聚合仍可正常使用。复制 `.dev.vars.example` 为 `.dev.vars` 可在本地测试 Worker，`.dev.vars` 已被忽略。

本地网站仍使用 `npm run dev` 启动 Node 实时拉取模式；`npm run worker:dev` 单独启动 Worker。Pages 详情使用 query 路由，避免刷新 404。
Actions 缓存上次数据：单源失败保留旧新闻并标注 stale；全部来源失败则取消发布，保留上次站点。正文成功结果缓存 24 小时，解析失败回退摘要。配图仅保存来源 URL，并未复制图片文件。
静态快照的热点密钥仍可选配置在仓库 Actions Secrets：`X_BEARER_TOKEN`、`YOUTUBE_API_KEY`；缺失时显示待配置，不影响新闻发布。
