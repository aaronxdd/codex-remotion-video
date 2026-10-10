import { XMLParser, XMLValidator } from "fast-xml-parser";
import { createHash } from "node:crypto";

export const categories = [
  ["all", "全部新闻", "◈"],
  ["china", "国内", "⌂"],
  ["world", "国际", "◎"],
  ["finance", "财经", "↗"],
  ["tech", "科技", "⌘"],
  ["society", "社会", "◷"],
  ["sports", "体育", "◉"],
  ["culture", "文娱", "♫"],
  ["health", "健康", "✚"],
  ["education", "教育", "▤"],
  ["life", "生活", "❋"],
].map(([id, name, icon]) => ({ id, name, icon }));
export const sources = [
  {id: "cls", name: "财联社", label: "财联社 · 首页资讯", category: "finance", url: "https://www.cls.cn/", kind: "cls"},
  ...[
    ["china", "china", "国内"],
    ["world", "world", "国际"],
    ["finance", "finance", "财经"],
    ["society", "society", "社会"],
    ["sports", "sports", "体育"],
    ["culture", "culture", "文娱"],
    ["health", "jk", "健康"],
    ["education", "edu", "教育"],
    ["life", "life", "生活"],
  ].map(([category, feed, label]) => ({
    id: `cns-${category}`,
    name: "中国新闻网",
    label: `中新网 · ${label}`,
    category,
    url: `https://www.chinanews.com.cn/rss/${feed}.xml`,
  })),
  {
    id: "ithome",
    name: "IT之家",
    label: "IT之家 · 科技",
    category: "tech",
    url: "https://www.ithome.com/rss/",
  },
  {
    id: "un",
    name: "联合国新闻",
    label: "联合国新闻 · 国际",
    category: "world",
    url: "https://news.un.org/feed/subscribe/zh/news/all/rss.xml",
  },
];
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: true,
  htmlEntities: true,
  parseTagValue: false,
  trimValues: true,
});
const list = (value) => (value ? (Array.isArray(value) ? value : [value]) : []);
const value = (text) =>
  typeof text === "string"
    ? text
    : typeof text === "number"
      ? String(text)
      : text?.["#text"] || "";
export const clean = (text) =>
  value(text)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
export function safeUrl(url, base) {
  try {
    const parsed = new URL(value(url), base);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
export function parseFeed(xml, source) {
  if (XMLValidator.validate(xml) !== true) throw new Error("订阅格式异常");
  const data = parser.parse(xml);
  if (!data.rss?.channel && !data.feed)
    throw new Error("返回的不是 RSS / Atom 订阅");
  return list(data.rss?.channel?.item || data.feed?.entry)
    .slice(0, 100)
    .flatMap((item) => {
      const title = clean(item.title);
      const link =
        typeof item.link === "string"
          ? item.link
          : list(item.link).find(
              (l) => !l["@_rel"] || l["@_rel"] === "alternate",
            )?.["@_href"];
      const url = link ? safeUrl(link, source.url) : "";
      if (!title || !url) return [];
      const html = value(
        item.description ||
          item.summary ||
          item["content:encoded"] ||
          item.content,
      );
      const media =
        list(item["media:content"]).find(
          (m) => m["@_medium"] === "image" || m["@_type"]?.startsWith("image/"),
        ) || list(item["media:thumbnail"])[0];
      const enclosure = list(item.enclosure).find((e) =>
        e["@_type"]?.startsWith("image/"),
      );
      const candidate =
        media?.["@_url"] ||
        enclosure?.["@_url"] ||
        html.match(/<img[^>]+src=["']([^"']+)/i)?.[1];
      const image = candidate
        ? safeUrl(candidate.replace(/&amp;/g, "&"), source.url)
        : "";
      const date = Date.parse(
        value(
          item.pubDate || item.published || item.updated || item["dc:date"],
        ),
      );
      return [
        {
          id: createHash("sha256").update(url).digest("hex").slice(0, 18),
          title,
          summary: clean(html).slice(0, 180),
          url,
          image,
          publishedAt: Number.isFinite(date)
            ? new Date(date).toISOString()
            : null,
          source: source.name,
          sourceId: source.id,
          category: source.category,
        },
      ];
    });
}
export function deduplicate(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.url.replace(/^http:/, "https:").replace(/#.*$/, "");
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()].sort(
    (a, b) =>
      (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0),
  );
}

export function parseCls(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("财联社页面格式变化");
  const rows = JSON.parse(match[1]).props.pageProps.hotArticleData;
  if (!Array.isArray(rows)) throw new Error("财联社资讯不可用");
  return rows.filter(a => /^\d+$/.test(String(a.id)) && a.title).map(a => ({
    id: `cls-${a.id}`, title: clean(a.title), summary: clean(a.brief).slice(0,180),
    url: `https://www.cls.cn/detail/${a.id}`, image: a.img ? safeUrl(a.img) : "",
    publishedAt: Number.isFinite(Number(a.ctime)) ? new Date(Number(a.ctime)*1000).toISOString() : null,
    source: "财联社", sourceId: "cls", category: "finance", views: Number(a.readNum)||0,
  }));
}

export function createNewsService({
  feeds = sources,
  fetcher = fetch,
  now = () => Date.now(),
} = {}) {
  const cache = new Map();
  let pending = null;
  let lastAttempt = 0;
  const snapshot = () => {
    const statuses = feeds.map((source) => {
      const record = cache.get(source.id);
      return {
        ...source,
        status: record?.error
          ? record.items.length
            ? "stale"
            : "error"
          : record
            ? "ok"
            : "loading",
        error: record?.error || null,
        count: record?.items.length || 0,
        updatedAt: record?.updatedAt || null,
        latestPublishedAt:
          record?.items.find((a) => a.publishedAt)?.publishedAt || null,
      };
    });
    const articles = deduplicate([...cache.values()].flatMap((r) => r.items));
    const updatedAt =
      statuses
        .map((s) => s.updatedAt)
        .filter(Boolean)
        .sort()
        .at(-1) || null;
    return {
      articles,
      sources: statuses,
      categories,
      updatedAt,
      lastAttemptAt: lastAttempt ? new Date(lastAttempt).toISOString() : null,
      refreshInterval: 120,
      partial: statuses.some((s) => s.status !== "ok"),
      total: articles.length,
    };
  };
  async function refresh() {
    lastAttempt = now();
    await Promise.all(
      feeds.map(async (source) => {
        try {
          const response = await fetcher(source.url, {
            signal: AbortSignal.timeout(12000),
            headers: {
              Accept:
                "application/rss+xml, application/atom+xml, application/xml, text/xml",
              "User-Agent": "CurrentNewsReader/1.0 (personal RSS reader)",
            },
          });
          if (!response.ok) throw new Error(`来源返回 HTTP ${response.status}`);
          const xml = await response.text();
          if (xml.length > 6 * 1024 * 1024)
            throw new Error("订阅内容超出大小限制");
          const items = source.kind === "cls" ? parseCls(xml) : parseFeed(xml, source);
          if (!items.length) throw new Error("来源暂未返回新闻条目");
          cache.set(source.id, {
            items,
            updatedAt: new Date(now()).toISOString(),
            error: null,
          });
        } catch (error) {
          const previous = cache.get(source.id);
          cache.set(source.id, {
            items: previous?.items || [],
            updatedAt: previous?.updatedAt || null,
            error:
              error.name === "TimeoutError"
                ? "来源请求超时"
                : error.message?.includes("HTTP")
                  ? error.message
                  : "来源暂时不可用或订阅格式异常",
          });
        }
      }),
    );
    return snapshot();
  }
  return {
    async get(force = false) {
      if (pending) return pending;
      const age = now() - lastAttempt;
      if (cache.size && age < (force ? 30000 : 120000)) return snapshot();
      pending = refresh().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
