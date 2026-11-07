import assert from "node:assert/strict";
import test from "node:test";
import { createReadCache } from "./readCache.js";

test("concurrent reads share one request, private results are not retained", async () => {
  const cache = createReadCache();
  let calls = 0;
  const load = () => ++calls;
  const first = cache.get("session-a:/me", load);
  assert.equal(cache.get("session-a:/me", load), first);
  assert.equal(await first, 1);
  assert.equal(await cache.get("session-a:/me", load), 2);
});

test("public data expires and different session keys never share data", async () => {
  let time = 0;
  let calls = 0;
  const cache = createReadCache({ now: () => time });
  const load = () => ++calls;
  assert.equal(await cache.get("a:/stats", load, 60), 1);
  time = 59;
  assert.equal(await cache.get("a:/stats", load, 60), 1);
  assert.equal(await cache.get("b:/stats", load, 60), 2);
  time = 60;
  assert.equal(await cache.get("a:/stats", load, 60), 3);
});

test("failed requests can be retried", async () => {
  const cache = createReadCache();
  await assert.rejects(cache.get("/meta", () => { throw new Error("offline"); }, 60));
  assert.equal(await cache.get("/meta", () => "online", 60), "online");
});

test("a read finishing after invalidation cannot overwrite newer data", async () => {
  const cache = createReadCache();
  let finish;
  const old = cache.get("/stats", () => new Promise((resolve) => { finish = resolve; }), 60);
  await Promise.resolve();
  cache.clear();
  assert.equal(await cache.get("/stats", () => "new", 60), "new");
  finish("old");
  await old;
  assert.equal(await cache.get("/stats", () => "unexpected", 60), "new");
});

test("a failed invalidated read cannot remove a newer cached result", async () => {
  const cache = createReadCache();
  let fail;
  const old = cache.get("/stats", () => new Promise((_, reject) => { fail = reject; }), 60);
  const rejected = assert.rejects(old);
  await Promise.resolve();
  cache.clear();
  await cache.get("/stats", () => "new", 60);
  fail(new Error("old request failed"));
  await rejected;
  assert.equal(await cache.get("/stats", () => "unexpected", 60), "new");
});

test("the cache remains bounded", async () => {
  const cache = createReadCache({ maxEntries: 2 });
  await cache.get("a", () => 1, 60);
  await cache.get("b", () => 2, 60);
  await cache.get("c", () => 3, 60);
  assert.equal(await cache.get("a", () => 4, 60), 4);
});
