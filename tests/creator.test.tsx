import React from "react";
import assert from "node:assert/strict";
import { create, act } from "react-test-renderer";
import { storyboard, buildVideo, motionPlan } from "../src/video/storyboard";

const downloaded: string[] = [];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.localStorage = { getItem: () => null, setItem: () => {} } as any;
globalThis.window = { setTimeout } as any;
globalThis.document = {
  getElementById: () => null,
  body: { appendChild: () => {} },
  createElement: () => ({
    href: "",
    download: "",
    click() {
      downloaded.push(this.href);
    },
    remove() {},
  }),
} as any;
let posts: any[] = [];
globalThis.fetch = (async (url, options) => {
  if (options?.method === "POST") {
    posts.push(JSON.parse(options.body as string));
    return { ok: true, json: async () => ({ id: "test-job" }) };
  }
  return {
    ok: true,
    json: async () => ({
      status: "done",
      progress: 1,
      url: "/api/download/test-job",
    }),
  };
}) as any;

const { App } = await import("../src/web/main");
let app: any;
await act(async () => {
  app = create(<App />);
});
const text = (v: any): string =>
  Array.isArray(v)
    ? v.map(text).join("")
    : v && typeof v === "object"
      ? text(v.props?.children)
      : v == null
        ? ""
        : String(v);
const buttons = () => app.root.findAllByType("button");
const button = (content: string) =>
  buttons().find((b: any) => text(b.props.children).includes(content));
const preview = () =>
  app.root.findByProps({ "data-testid": "player" }).props.inputProps;
const idea =
  "让玻璃几何体在青色光晕中缓缓旋转。文字轻盈浮现，以通透的质感，开启下一段创意。";
await act(async () =>
  app.root.findByType("textarea").props.onChange({ target: { value: idea } }),
);
await act(async () =>
  buttons()
    .find(
      (b: any) =>
        b.props.className?.includes("style-card") &&
        text(b.props.children).includes("电影叙事"),
    )
    .props.onClick(),
);
assert.equal(
  preview().styleId,
  "cinema",
  "Style must immediately match current selection",
);
assert.equal(preview().idea, idea);
assert.equal(
  button("导出视频").props.disabled,
  false,
  "Export is available without a stale-preview gate",
);
await act(async () => button("生成视频预览").props.onClick());
await act(async () => new Promise((resolve) => setTimeout(resolve, 150)));
assert.equal(
  preview().styleId,
  "cinema",
  "Updating preview must not restore old style",
);
await act(async () => button("导出视频").props.onClick());
assert.equal(posts.at(-1).idea, idea);
assert.equal(posts.at(-1).styleId, "cinema");
assert.deepEqual(
  downloaded,
  ["/api/download/test-job"],
  "Export should trigger download, not merely display a link",
);
const next = "一杯热咖啡。让香气缓缓升起。";
await act(async () =>
  app.root.findByType("textarea").props.onChange({ target: { value: next } }),
);
assert.equal(preview().idea, next);
assert.equal(button("导出视频").props.disabled, false);
assert.equal(
  app.root.findAllByProps({ href: "/api/download/test-job" }).length,
  0,
  "Old download must not masquerade as new content",
);
await act(async () => button("导出视频").props.onClick());
assert.equal(
  posts.at(-1).idea,
  next,
  "Export after editing uses the latest draft",
);
globalThis.fetch = (async () => ({
  ok: false,
  json: async () => ({ error: "渲染服务暂时不可用" }),
})) as any;
await act(async () =>
  app.root
    .findByType("textarea")
    .props.onChange({ target: { value: "导出错误测试" } }),
);
await act(async () => button("导出视频").props.onClick());
assert(
  text(app.root.findByProps({ role: "alert" }).props.children).includes(
    "渲染服务暂时不可用",
  ),
);
assert.equal(
  button("导出视频").props.disabled,
  false,
  "Errors should leave export retryable",
);
await act(async () => app.unmount());

assert.equal(
  storyboard(idea)
    .map((s) => s.caption)
    .join(""),
  idea,
);
assert(storyboard(idea).every((s) => !s.title.includes("让灵感成为作品")));
const long = "这是一个很长的内容".repeat(55);
assert.equal(
  storyboard(long)
    .map((s) => s.caption)
    .join(""),
  long,
  "No content may be silently truncated",
);
assert.equal(
  buildVideo("", "data:image/png;base64,AA==", "neon").styleId,
  "neon",
);
assert.equal(motionPlan(next).subject, "cup");
assert.equal(motionPlan("香水瓶身缓缓旋转").subject, "bottle");
assert.equal(motionPlan(idea).rotate, true);
assert.equal(motionPlan("一个普通品牌故事").subject, "type");
console.log(
  "PASS: content + style sync, preview update, current-draft export, automatic download, retry, complete storyboard and subject selection.",
);
