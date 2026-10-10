import React from "react";
import assert from "node:assert/strict";
import { create, act } from "react-test-renderer";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const storage = new Map();
globalThis.localStorage = {
  getItem: (k: string) => storage.get(k) || null,
  setItem: (k: string, v: string) => storage.set(k, v),
} as any;
globalThis.document = {
  getElementById: () => null,
  visibilityState: "visible",
  addEventListener() {},
  removeEventListener() {},
} as any;
globalThis.window = { addEventListener() {}, removeEventListener() {} } as any;
const articles = [
  {
    id: "a",
    title: "测试科技：人工智能进展",
    source: "IT之家",
    category: "tech",
  },
  { id: "b", title: "测试国际新闻", source: "联合国新闻", category: "world" },
  { id: "c", title: "测试国内新闻", source: "中国新闻网", category: "china" },
].map((a) => ({
  ...a,
  summary: "测试摘要",
  sourceId: a.source,
  url: "https://example.com/" + a.id,
  image: "",
  publishedAt: new Date().toISOString(),
}));
const mock = {
  articles,
  total: 3,
  updatedAt: new Date().toISOString(),
  sources: [],
  partial: false,
  categories: [],
};
let calls = 0;
globalThis.fetch = (async () => {
  calls++;
  return { ok: true, json: async () => mock };
}) as any;
const { App } = await import("../src/news/main");
let app: any;
await act(async () => {
  app = create(<App />);
});
const text = (v: any): string =>
  Array.isArray(v)
    ? v.map(text).join("")
    : v && typeof v === "object"
      ? text(v.props?.children)
      : v == null || typeof v === "boolean"
        ? ""
        : String(v);
const btn = (label: string) =>
  app.root
    .findAllByType("button")
    .find((b: any) => text(b.props.children) === label);
const articleCount = () => app.root.findAllByType("article").length;
assert.equal(articleCount(), 3);
assert.equal(calls, 1);
assert.equal(app.root.findByProps({"aria-label":"排序方式"}).props.value,"heat");
assert(app.root.findAllByType("a").filter((a:any)=>a.props.href?.startsWith("/news/")).length>0);
await act(async()=>app.root.findByProps({"aria-label":"最低显示热度"}).props.onChange({target:{value:"5"}}));
assert.equal(articleCount(),0);
await act(async()=>app.root.findByProps({"aria-label":"最低显示热度"}).props.onChange({target:{value:"1"}}));
assert.equal(articleCount(),3);
await act(async()=>app.root.findByProps({"aria-label":"排序方式"}).props.onChange({target:{value:"time"}}));
assert.equal(app.root.findByProps({"aria-label":"排序方式"}).props.value,"time");
const {heat}=await import("../src/news/heat");
assert.equal(heat({publishedAt:null}),1);
assert.equal(heat({publishedAt:new Date().toISOString(),views:100000}),5);
assert.equal(heat({publishedAt:new Date().toISOString()}),3);
await act(async () => btn("⌘科技").props.onClick());
assert.equal(articleCount(), 1);
assert(
  text(app.root.findByType("article").props.children).includes("测试科技"),
);
await act(async () =>
  app.root
    .findByProps({ "aria-label": "搜索新闻" })
    .props.onChange({ target: { value: "不存在" } }),
);
assert.equal(articleCount(), 0);
await act(async () =>
  app.root
    .findAllByType("button")
    .find((b: any) => text(b.props.children).includes("查看全部新闻"))
    .props.onClick(),
);
assert.equal(articleCount(), 3);
await act(async () =>
  app.root.findAllByProps({ "aria-label": "收藏新闻" })[0].props.onClick(),
);
assert.equal(JSON.parse(storage.get("current-bookmarks")).length, 1);
await act(async () =>
  app.root
    .findAllByType("button")
    .find((b: any) => text(b.props.children).includes("我的收藏"))
    .props.onClick(),
);
assert.equal(articleCount(), 1);
await act(async () =>
  app.root.findByProps({ "aria-label": "取消收藏" }).props.onClick(),
);
assert.equal(articleCount(), 0);
await act(async () =>
  app.root
    .findAllByType("button")
    .find((b: any) => text(b.props.children).includes("查看全部新闻"))
    .props.onClick(),
);
await act(async () =>
  app.root
    .findByProps({ "aria-label": "按来源筛选" })
    .props.onChange({ target: { value: "联合国新闻" } }),
);
assert.equal(articleCount(), 1);
assert(
  text(app.root.findByType("article").props.children).includes("测试国际"),
);
await act(async () => btn("自动刷新").props.onClick());
assert(btn("已暂停刷新"));
await act(async () =>
  app.root
    .findAllByType("button")
    .find((b: any) => text(b.props.children).includes("新闻来源"))
    .props.onClick(),
);
assert(app.root.findByProps({ role: "dialog" }));
await act(async () => app.unmount());
console.log(
  "PASS: 新闻加载、分类、搜索、清除筛选、收藏持久化、来源过滤、暂停刷新。",
);
