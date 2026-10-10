import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { heat } from "./heat";
import { HotPanel, Detail, remember } from "./sections";
type Article = {
  views?: number;
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  publishedAt: string | null;
  source: string;
  sourceId: string;
  category: string;
};
type Source = {
  id: string;
  name: string;
  label: string;
  category: string;
  url: string;
  status: string;
  error: string | null;
  count: number;
  updatedAt: string | null;
  latestPublishedAt: string | null;
};
type Category = { id: string; name: string; icon: string };
type Data = {
  articles: Article[];
  sources: Source[];
  categories: Category[];
  updatedAt: string | null;
  lastAttemptAt: string | null;
  partial: boolean;
  total: number;
};
const categories: Category[] = [
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
const name = (id: string) =>
  categories.find((c) => c.id === id)?.name || "综合";
const time = (date: string | null) =>
  date
    ? new Date(date).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Shanghai",
      })
    : "时间未知";
function ago(date: string | null) {
  if (!date) return "来源未提供时间";
  const minutes = Math.floor((Date.now() - Date.parse(date)) / 60000);
  if (minutes < -5)
    return new Date(date).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
    });
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
}
function stored(): Article[] {
  try {
    const v = JSON.parse(localStorage.getItem("current-bookmarks") || "[]");
    return Array.isArray(v)
      ? v.filter((a) => a.id && a.title && /^https?:\/\//.test(a.url))
      : [];
  } catch {
    return [];
  }
}
function Picture({
  article,
  hero = false,
}: {
  article: Article;
  hero?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [article.image]);
  return article.image && !failed ? (
    <img
      src={article.image}
      alt=""
      loading={hero ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`fallback ${article.category}`}>
      <span>{name(article.category)}</span>
      <strong>{categories.find((c) => c.id === article.category)?.icon}</strong>
      <small>CURRENT / NEWS</small>
    </div>
  );
}
export function App() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("heat");
  const [minHeat, setMinHeat] = useState(1);
  const [auto, setAuto] = useState(true);
  const [saved, setSaved] = useState<Article[]>(stored);
  const [showSources, setShowSources] = useState(false);
  const [limit, setLimit] = useState(15);
  const [notice, setNotice] = useState("");
  const inflight = useRef(false);
  const search = useRef<HTMLInputElement>(null);
  const refresh = async (force = false) => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/news" + (force ? "?refresh=1" : ""), {
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (result.articles) { setData(result); remember(result.articles); }
      if (!response.ok)
        throw new Error(result.error || "新闻源暂时不可用，请稍后刷新。");
      setError("");
    } catch (e) {
      setError(
        e instanceof Error && e.name === "TimeoutError"
          ? "请求超时，请稍后重试。"
          : e instanceof Error
            ? e.message
            : "网络连接异常",
      );
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 60000);
    const visible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [auto]);
  useEffect(() => setLimit(15), [category, query, source, range, sort, minHeat]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSources(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const save = (article: Article) => {
    const next = saved.some((a) => a.id === article.id)
      ? saved.filter((a) => a.id !== article.id)
      : [article, ...saved].slice(0, 200);
    setSaved(next);
    try {
      localStorage.setItem("current-bookmarks", JSON.stringify(next));
      setNotice("");
    } catch {
      setNotice("浏览器存储空间不足，收藏仅保留在本次访问。");
    }
  };
  const articles = data?.articles || [];
  const filtered = useMemo(() => {
    const start =
      range === "day"
        ? Date.now() - 86400000
        : range === "week"
          ? Date.now() - 7 * 86400000
          : 0;
    return (category === "saved" ? saved : articles).filter(
      (a) =>
        (["all", "saved"].includes(category) || a.category === category) &&
        (source === "all" || a.source === source) &&
        heat(a) >= minHeat &&
        (!start ||
          Boolean(a.publishedAt && Date.parse(a.publishedAt) >= start)) &&
        `${a.title} ${a.summary} ${a.source}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    ).sort((a,b) => (sort === "heat" ? heat(b)-heat(a) : 0) || (Date.parse(b.publishedAt || "") || 0)-(Date.parse(a.publishedAt || "") || 0));
  }, [data, saved, category, source, range, query, sort, minHeat]);
  const focus = filtered[0];
  const rest = filtered.slice(1, limit);
  const ok = data?.sources.filter((s) => s.status === "ok").length || 0;
  const date = new Date();
  const topics = [
    "人工智能",
    "经济",
    "中国",
    "国际",
    "科技",
    "教育",
    "健康",
    "体育",
  ]
    .map((word) => ({
      word,
      count: articles.filter((a) => (a.title + " " + a.summary).includes(word))
        .length,
    }))
    .filter((t) => t.count)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const reset = () => {
    setCategory("all");
    setSource("all");
    setQuery("");
    setRange("all");
    setMinHeat(1);
  };
  const stars = (a: Article) => <span className="heat-stars" aria-label={`本站热度 ${heat(a)} 星`} title={`本站热度：${heat(a)}/5。根据发布时间和可用来源阅读量估算，非全网真实热度。${a.views ? `来源阅读量：${a.views}` : "来源未提供阅读量。"}`}>{"★".repeat(heat(a))}<span>{"☆".repeat(5-heat(a))}</span></span>;
  const mark = (a: Article) => (
    <button
      className={`bookmark ${saved.some((s) => s.id === a.id) ? "marked" : ""}`}
      onClick={() => save(a)}
      aria-label={saved.some((s) => s.id === a.id) ? "取消收藏" : "收藏新闻"}
      title={saved.some((s) => s.id === a.id) ? "取消收藏" : "收藏新闻"}
    >
      {saved.some((s) => s.id === a.id) ? "◆" : "◇"}
    </button>
  );
  const path = window.location?.pathname || "/";
  if (path.startsWith("/news/")) return <Detail id={path.slice(6)} articles={[...articles,...saved]} loading={loading} />;
  if (path === "/hot") return <HotPanel />;
  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand" onClick={reset}>
          <span className="brand-icon">此</span>
          <strong>
            此刻<span>CURRENT</span>
          </strong>
          <i>•</i>
        </button>
        <div className="side-caption">发现世界的每一面</div>
        <nav>
          <a className="hot-nav" href="/hot">♨ 热点榜单</a>
          {categories.map((c) => (
            <button
              key={c.id}
              className={category === c.id ? "active" : ""}
              onClick={() => { setCategory(c.id); setSource("all"); }}
            >
              <span>{c.icon}</span>
              {c.name}
              {c.id === "all" && <small>{articles.length}</small>}
            </button>
          ))}
          <button
            className="mobile-action"
            onClick={() => setCategory("saved")}
          >
            ◇ 收藏
          </button>
          <button
            className="mobile-action"
            onClick={() => setShowSources(true)}
          >
            ◫ 来源
          </button>
        </nav>
        <div className="nav-divider" />
        <button
          className={`side-action ${category === "saved" ? "active" : ""}`}
          onClick={() => setCategory("saved")}
        >
          <span>◇</span>我的收藏<small>{saved.length}</small>
        </button>
        <button className="side-action" onClick={() => setShowSources(true)}>
          <span>◫</span>新闻来源<span className="end">↗</span>
        </button>
        <div className="sidebar-bottom">
          <span className="signal" />
          <div>
            保持好奇，独立思考。<small>多源聚合 · 站内阅读</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            发现 <span>/</span>{" "}
            <strong>
              {category === "saved" ? "我的收藏" : name(category)}
            </strong>
          </div>
          <label className="search">
            <span>⌕</span>
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索新闻、话题或来源…"
              aria-label="搜索新闻"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="清空搜索">
                ×
              </button>
            ) : (
              <kbd>⌘ K</kbd>
            )}
          </label>
          <button
            className={`auto ${auto ? "enabled" : ""}`}
            onClick={() => setAuto(!auto)}
            title="页面每分钟检查更新，新闻源缓存两分钟"
          >
            <i />
            {auto ? "自动刷新" : "已暂停刷新"}
          </button>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE WORLD, RIGHT NOW</div>
              <h1>
                {category === "saved"
                  ? "值得留住的消息。"
                  : "每一刻，连接世界。"}
              </h1>
              <p>从国内到全球，让重要的消息，来到你面前。</p>
            </div>
            <div className="edition">
              <span>
                {date.toLocaleDateString("zh-CN", {
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Shanghai",
                })}
              </span>
              <strong>
                {date.toLocaleDateString("zh-CN", {
                  weekday: "long",
                  timeZone: "Asia/Shanghai",
                })}{" "}
                <i>·</i> 新闻聚合
              </strong>
            </div>
          </div>
          <div className="overview">
            <div className="live-pill">
              <i /> LIVE FEED
            </div>
            <span>
              已收录 <strong>{articles.length}</strong> 条资讯
            </span>
            <span className="overview-divider" />
            <button onClick={() => setShowSources(true)}>
              <strong>
                {ok}/{data?.sources.length || 11}
              </strong>{" "}
              个订阅源正常 <span>↗</span>
            </button>
            <span className="updated">
              上次获取 {data?.updatedAt ? time(data.updatedAt) : "等待同步"}
            </span>
            <button
              className="refresh"
              onClick={() => void refresh(true)}
              disabled={loading}
            >
              <span className={loading ? "spinning" : ""}>↻</span>{" "}
              {loading ? "同步中" : "刷新"}
            </button>
          </div>
          {(error || notice) && (
            <div className="alert" role="alert">
              {error || notice}
              {error && (
                <button onClick={() => void refresh(true)}>重试</button>
              )}
            </div>
          )}
          {data?.partial && (
            <div className="partial">
              部分来源暂不可用，已保留可用资讯。
              <button onClick={() => setShowSources(true)}>
                查看来源状态 →
              </button>
            </div>
          )}
          {category === "finance" && <div className="finance-tabs" aria-label="财经子栏目">{[["all","全部财经"],["财联社","财联社"],["中国新闻网","中新网财经"]].map(([id,label])=><button key={id} className={source===id?"selected":""} onClick={()=>setSource(id)}>{label}</button>)}</div>}
          <div className="content-grid">
            <section className="news-column">
              <div className="section-heading">
                <div>
                  <h2>
                    {category === "saved"
                      ? "我的收藏"
                      : query
                        ? "搜索结果"
                        : category === "all"
                          ? "最新资讯"
                          : name(category) + "资讯"}
                  </h2>
                  <span>{filtered.length} 条</span>
                </div>
                <div className="filters">
                  <select aria-label="排序方式" value={sort} onChange={e=>setSort(e.target.value)}><option value="heat">热度优先</option><option value="time">最新发布</option></select>
                  <select aria-label="最低显示热度" value={minHeat} onChange={e=>setMinHeat(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n===1?"显示全部星级":`仅显示 ≥ ${n} 星`}</option>)}</select>
                  <select
                    aria-label="按来源筛选"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="all">全部来源</option>
                    {[
                      ...new Set([...articles, ...saved].map((a) => a.source)),
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    aria-label="按时间筛选"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                  >
                    <option value="all">全部时间</option>
                    <option value="day">近 24 小时</option>
                    <option value="week">近 7 天</option>
                  </select>
                </div>
              </div>
              <details className="heat-explainer"><summary>本站热度如何计算？</summary><p>5 星制：6 小时内发布为 3 星，24 小时内为 2 星，其余或时间未知为 1 星；来源阅读量达到 1 万加 1 星，达到 10 万加 2 星。没有阅读量时仅按时效计算，不代表全网人气。相同星级按发布时间排序。</p></details>
              {loading && !data ? (
                <div className="skeleton" aria-label="正在加载真实新闻">
                  <div />
                  <div />
                  <div />
                  <p>正在连接新闻来源…</p>
                </div>
              ) : !focus ? (
                <div className="empty">
                  <span>◈</span>
                  <h3>
                    {category === "saved"
                      ? "收藏你想稍后阅读的新闻"
                      : "暂无符合条件的新闻"}
                  </h3>
                  <p>
                    {category === "saved"
                      ? "点击新闻右侧的菱形按钮，随时回来阅读。"
                      : "试试其他关键词、分类，或等待来源更新。"}
                  </p>
                  <button onClick={reset}>查看全部新闻 →</button>
                </div>
              ) : (
                <>
                  <article className="hero">
                    <a
                      href={`/news/${focus.id}`}
                      className="hero-image"
                    >
                      <Picture article={focus} hero />
                      <span className="image-tag">{name(focus.category)}</span>
                    </a>
                    <div className="hero-body">
                      <div className="article-meta">
                        <span className="source-badge">
                          {focus.source.slice(0, 1)}
                        </span>
                        <span>{focus.source}</span>
                        {stars(focus)}
                        <i>·</i>
                        <time title={focus.publishedAt || "来源未提供时间"}>
                          {ago(focus.publishedAt)}
                        </time>
                        {mark(focus)}
                      </div>
                      <a
                        href={`/news/${focus.id}`}
                      >
                        <h2>{focus.title}</h2>
                      </a>
                      {focus.summary && <p>{focus.summary}</p>}
                      <a
                        className="read-original"
                        href={`/news/${focus.id}`}
                      >
                        查看详情 <span>↗</span>
                      </a>
                    </div>
                  </article>
                  <div className="news-list">
                    {rest.map((a) => (
                      <article key={a.id} className="news-item">
                        <div className="news-item-body">
                          <div className="item-meta">
                            <span className={`category-tag ${a.category}`}>
                              {name(a.category)}
                            </span>
                            <span>{a.source}</span>
                            {stars(a)}
                            <i>·</i>
                            <time title={a.publishedAt || "时间未知"}>
                              {ago(a.publishedAt)}
                            </time>
                          </div>
                          <a
                            href={`/news/${a.id}`}
                          >
                            <h3>{a.title}</h3>
                          </a>
                          {a.summary && <p>{a.summary}</p>}
                          <div className="item-actions">
                            <a
                              href={`/news/${a.id}`}
                            >
                              查看详情 ↗
                            </a>
                            {mark(a)}
                          </div>
                        </div>
                        <a
                          className="item-image"
                          href={`/news/${a.id}`}
                          aria-label={a.title}
                        >
                          <Picture article={a} />
                        </a>
                      </article>
                    ))}
                  </div>
                  {filtered.length > limit && (
                    <button
                      className="load-more"
                      onClick={() => setLimit(limit + 15)}
                    >
                      查看更多新闻 <span>↓</span>
                    </button>
                  )}
                </>
              )}
            </section>
            <aside className="right-rail">
              <section className="rail-card digest">
                <div className="rail-title">
                  <h2>此刻速览</h2>
                  <span className="tiny-live">
                    <i /> 按发布时间
                  </span>
                </div>
                <div className="timeline">
                  {articles.slice(0, 5).map((a) => (
                    <a
                      key={a.id}
                      href={`/news/${a.id}`}
                    >
                      <time>{time(a.publishedAt)}</time>
                      <h3>{a.title}</h3>
                      <small>{a.source}</small>
                    </a>
                  ))}
                  {!articles.length && (
                    <p className="muted">等待新闻来源同步</p>
                  )}
                </div>
              </section>
              <section className="rail-card topics">
                <div className="rail-title">
                  <h2>话题索引</h2>
                  <span>当前资讯</span>
                </div>
                {topics.map((t, i) => (
                  <button
                    key={t.word}
                    onClick={() => {
                      setCategory("all");
                      setSource("all");
                      setRange("all");
                      setQuery(t.word);
                    }}
                  >
                    <span className="rank">0{i + 1}</span>
                    <strong>{t.word}</strong>
                    <small>{t.count} 篇</small>
                    <span>↗</span>
                  </button>
                ))}
                {!topics.length && (
                  <p className="muted">话题将在新闻更新后出现</p>
                )}
              </section>
              <section className="source-card">
                <div className="source-icon">◫</div>
                <h3>信息有出处，阅读有选择。</h3>
                <p>
                  直接连接媒体公开订阅。
                  <br />
                  不生成新闻，不改写标题。
                </p>
                <button onClick={() => setShowSources(true)}>
                  查看全部新闻源 <span>↗</span>
                </button>
              </section>
              <div className="rail-note">
                每 2 分钟同步订阅源
                <br />
                新闻时效取决于来源发布频率
                <br />
                聚合所接入来源，不代表全网全部新闻
              </div>
            </aside>
          </div>
          <footer>
            <span>
              <b>此刻</b> CURRENT NEWS
            </span>
            <span>内容版权归原媒体所有 · 点击标题站内阅读</span>
            <button onClick={() => setShowSources(true)}>关于数据来源 ↗</button>
          </footer>
        </main>
      </div>
      {showSources && (
        <div className="modal-backdrop" onClick={() => setShowSources(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="新闻来源"
            className="sources-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setShowSources(false)}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="eyebrow">CONNECTED TO THE WORLD</div>
            <h2>新闻来源</h2>
            <p>官方 RSS 订阅与公开首页资讯。获取时间不等于新闻发布时间。</p>
            <div className="source-table">
              {(data?.sources || []).map((s) => (
                <div key={s.id}>
                  <div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label} ↗
                    </a>
                    <small>
                      {s.error || `${s.count} 条 · 获取于 ${time(s.updatedAt)}`}
                      <br />
                      最新报道：
                      {s.latestPublishedAt
                        ? new Date(s.latestPublishedAt).toLocaleString(
                            "zh-CN",
                            { timeZone: "Asia/Shanghai" },
                          )
                        : "未知"}
                    </small>
                  </div>
                  <span className={`source-status ${s.status}`}>
                    {s.status === "ok"
                      ? "已连接"
                      : s.status === "stale"
                        ? "历史缓存"
                        : s.status === "loading"
                          ? "连接中"
                          : "暂不可用"}
                  </span>
                </div>
              ))}
            </div>
            {!data && <p>正在获取来源状态，请稍后重试。</p>}
            <div className="source-explanation">
              如来源不可用，会保留本次服务运行期间的缓存，并标明状态。NewsAPI
              等商业服务需要独立密钥与套餐，当前未启用。
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
