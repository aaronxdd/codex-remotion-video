import test from "node:test";
import assert from "node:assert/strict";
import {handle} from "../worker/index.mjs";

const cache = {match: async () => undefined, put: async () => {}};
const env = {ALLOWED_ORIGIN: "https://aaronxdd.github.io"};

test("Worker 健康检查包含 CORS", async () => {
  const response = await handle(
    new Request("https://api.example.com/api/health", {
      headers: {Origin: "https://aaronxdd.github.io"},
    }),
    env,
    cache,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), env.ALLOWED_ORIGIN);
  assert.deepEqual(await response.json(), {ok: true, app: "current-news-api"});
});

test("Worker 拒绝未授权网页和非 GET 请求", async () => {
  const forbidden = await handle(
    new Request("https://api.example.com/api/health", {
      headers: {Origin: "https://evil.example"},
    }),
    env,
    cache,
  );
  assert.equal(forbidden.status, 403);
  const method = await handle(
    new Request("https://api.example.com/api/health", {method: "POST"}),
    env,
    cache,
  );
  assert.equal(method.status, 405);
});
