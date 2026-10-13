import {createNewsService} from "../news-service.mjs";
import {createHotService} from "../hot-service.mjs";
import {createArticleService} from "../article-service.mjs";

const news = createNewsService();
const articles = createArticleService();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

function cors(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = new Set([
    env.ALLOWED_ORIGIN || "https://aaronxdd.github.io",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);
  if (!origin) return {};
  if (!allowed.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function load(pathname, url, env) {
  if (pathname === "/api/health")
    return json({ok: true, app: "current-news-api"});
  if (pathname === "/api/news") {
    const data = await news.get(url.searchParams.get("refresh") === "1");
    return json(data, data.total ? 200 : 503);
  }
  if (pathname === "/api/hot")
    return json(await createHotService(news, env).get());
  if (pathname.startsWith("/api/article/")) {
    const id = decodeURIComponent(pathname.slice(13));
    const data = await news.get();
    const hot = await createHotService(news, env).get();
    const article = [...data.articles, ...hot.platforms.flatMap((p) => p.items)]
      .find((item) => item.id === id);
    return article
      ? json(await articles.get(article))
      : json({error: "新闻已离开当前来源列表"}, 404);
  }
  return json({error: "接口不存在"}, 404);
}

export async function handle(request, env, cache = caches.default) {
  const corsHeaders = cors(request, env);
  if (!corsHeaders) return json({error: "不允许的来源"}, 403);
  if (request.method === "OPTIONS")
    return new Response(null, {status: 204, headers: corsHeaders});
  if (request.method !== "GET")
    return json({error: "仅支持 GET 请求"}, 405, corsHeaders);

  const url = new URL(request.url);
  const isHealth = url.pathname === "/api/health";
  const forced = url.pathname === "/api/news" && url.searchParams.get("refresh") === "1";
  const ttl = url.pathname.startsWith("/api/article/") ? 600 : 120;
  const cacheUrl = new URL(url);
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl, {method: "GET"});

  if (!isHealth && !forced) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const response = new Response(hit.body, hit);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      response.headers.set("X-Cache", "HIT");
      return response;
    }
  }

  try {
    const loaded = await load(url.pathname, url, env);
    const response = new Response(loaded.body, loaded);
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    response.headers.set("Cache-Control", isHealth ? "no-store" : `public, max-age=30, s-maxage=${ttl}`);
    response.headers.set("X-Cache", "MISS");
    if (!isHealth && loaded.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return json(
      {error: "新闻服务暂时不可用", detail: error instanceof Error ? error.message : "未知错误"},
      503,
      {...corsHeaders, "Cache-Control": "no-store"},
    );
  }
}

export default {
  fetch(request, env) {
    return handle(request, env);
  },
};
