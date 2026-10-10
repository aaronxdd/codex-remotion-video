import test from "node:test";
import assert from "node:assert/strict";
import {
  parseFeed,
  clean,
  safeUrl,
  deduplicate,
  createNewsService,
} from "../news-service.mjs";
const source = {
  id: "test",
  name: "测试媒体",
  category: "world",
  url: "https://example.com/feed",
};
const xml = `<rss><channel><item><title>真实标题 &amp; 测试</title><link>https://example.com/a</link><description><![CDATA[<p>一段摘要</p><img src="https://example.com/image.jpg"/><script>bad()</script>]]></description><pubDate>Sat, 10 Oct 2026 11:00:00 +0800</pubDate></item><item><title>坏链接</title><link>javascript:alert(1)</link></item></channel></rss>`;
test("RSS 保留来源时间、去掉 HTML、禁止非 HTTP 链接", () => {
  const a = parseFeed(xml, source);
  assert.equal(a.length, 1);
  assert.equal(a[0].title, "真实标题 & 测试");
  assert.equal(a[0].publishedAt, "2026-10-10T03:00:00.000Z");
  assert.equal(a[0].summary, "一段摘要");
  assert.equal(a[0].image, "https://example.com/image.jpg");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(clean("<script>x()</script>正文"), "正文");
});
test("Atom 与未知发布时间不会伪造为当前时间", () => {
  const a = parseFeed(
    '<feed><entry><title>Atom</title><link href="https://example.com/atom"/><updated>invalid</updated><summary>内容</summary></entry></feed>',
    source,
  );
  assert.equal(a[0].publishedAt, null);
  assert.equal(a[0].url, "https://example.com/atom");
  assert.throws(() => parseFeed("<html><body>验证</body></html>", source));
});
test("重复链接合并，按发布时间排序", () => {
  const a = parseFeed(xml, source)[0];
  assert.equal(deduplicate([a, { ...a, url: a.url + "#x" }]).length, 1);
  assert.equal(
    deduplicate([
      a,
      {
        ...a,
        id: "b",
        url: "https://example.com/b",
        publishedAt: "2026-10-11T00:00:00Z",
      },
    ])[0].id,
    "b",
  );
});
test("缓存、并发合并、单源失败保留旧数据并标明 stale", async () => {
  let current = Date.parse("2026-10-10T04:00:00Z");
  let count = 0;
  let fail = false;
  const service = createNewsService({
    feeds: [source],
    now: () => current,
    fetcher: async () => {
      count++;
      if (fail) throw Error("offline");
      return { ok: true, text: async () => xml };
    },
  });
  const [a, b] = await Promise.all([service.get(), service.get()]);
  assert.equal(count, 1);
  assert.equal(a.total, 1);
  await service.get();
  assert.equal(count, 1);
  current += 130000;
  fail = true;
  const stale = await service.get();
  assert.equal(stale.sources[0].status, "stale");
  assert.equal(stale.total, 1);
  assert.equal(stale.updatedAt, a.updatedAt);
  assert.equal(stale.partial, true);
});
test("完全不可用时返回空数据与错误状态，不制造示例新闻", async () => {
  const service = createNewsService({
    feeds: [source],
    fetcher: async () => {
      throw Error("offline");
    },
  });
  const data = await service.get();
  assert.equal(data.total, 0);
  assert.equal(data.sources[0].status, "error");
  assert.equal(data.updatedAt, null);
});
