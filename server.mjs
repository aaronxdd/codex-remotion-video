import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createNewsService } from "./news-service.mjs";
import { createHotService } from "./hot-service.mjs";
import { createArticleService } from "./article-service.mjs";
import { existsSync } from "node:fs";
const root = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
const vite = await createViteServer({
  root,
  server: { middlewareMode: true },
  appType: "spa",
});
const news = createNewsService();
const hot = createHotService(news);
const articleService=createArticleService();
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/health")
    return json(res, 200, { ok: true, app: "current-news" });
  if (url.pathname === '/api/hot' && req.method === 'GET') return json(res,200,await hot.get());
  if (url.pathname.startsWith('/api/article/') && req.method === 'GET') {
    const id=url.pathname.slice(13);
    const data=await news.get();
    const article=data.articles.find(a=>a.id===id) || (await hot.get()).platforms.flatMap(p=>p.items).find(a=>a.id===id);
    return json(res,article?200:404,article ? await articleService.get(article) : {error:'新闻已离开当前来源列表'});
  }
  if (url.pathname === "/api/news" && req.method === "GET") {
    try {
      const data = await news.get(url.searchParams.get("refresh") === "1");
      return json(res, data.total ? 200 : 503, data);
    } catch {
      return json(res, 503, { error: "暂时无法获取新闻，请稍后重试。" });
    }
  }
  if (url.pathname.startsWith("/api/"))
    return json(res, 404, { error: "接口不存在" });
  vite.middlewares(req, res, () => {
    res.statusCode = 404;
    res.end("Not found");
  });
});
server.listen(3000, "127.0.0.1", () => {
  console.log("此刻新闻已启动：http://localhost:3000");
  void news
    .get()
    .then((data) =>
      console.log(
        `新闻源就绪：${data.total} 条，${data.sources.filter((s) => s.status === "ok").length}/${data.sources.length} 个订阅正常`,
      ),
    );
});
server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close();
    void vite.close().then(() => process.exit(0));
  });
