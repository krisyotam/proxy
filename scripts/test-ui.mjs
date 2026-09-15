import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
const html = readFileSync(
  new URL("../internal/api/ui/management.html", import.meta.url),
  "utf8",
);
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { quotaWindows, poolSummary, escapeHTML, providerKey } =
  context.ProxyData;
test("Codex weekly quota uses remaining percentage, including exhausted accounts", () => {
  const a = {
    provider: "codex",
    quota: {
      signals: {
        "X-Codex-Primary-Used-Percent": "33",
        "X-Codex-Primary-Window-Minutes": "10080",
        "X-Codex-Secondary-Used-Percent": "100",
        "X-Codex-Secondary-Window-Minutes": "300",
      },
    },
  };
  assert.equal(quotaWindows(a)[0].remaining, 67);
  assert.equal(quotaWindows(a)[0].label, "Weekly window");
  assert.equal(quotaWindows(a)[1].remaining, 0);
});
test("Claude utilization is a fraction, not a percentage", () => {
  const a = {
    provider: "claude",
    quota: {
      signals: {
        "Anthropic-Ratelimit-Unified-7d-Utilization": "0.53",
        "Anthropic-Ratelimit-Unified-7d-Reset": "1787695200",
      },
    },
  };
  assert.equal(quotaWindows(a)[0].remaining, 47);
  assert.equal(quotaWindows(a)[0].reset, "1787695200");
});
test("Plugin quota buckets preserve zero and ignore absent or malformed data", () => {
  const a = {
    normalizedQuota: {
      groups: [
        {
          displayName: "Grok",
          buckets: [
            { window: "Weekly", remainingFraction: 0 },
            { remainingFraction: null },
            { remainingFraction: "bad" },
            { remainingFraction: 1.5 },
          ],
        },
      ],
    },
  };
  assert.equal(quotaWindows(a).length, 2);
  assert.equal(quotaWindows(a)[0].remaining, 0);
  assert.equal(quotaWindows(a)[1].remaining, 100);
});
test("Missing quota never becomes a full or empty allowance", () => {
  assert.equal(
    quotaWindows({
      provider: "codex",
      quota: { signals: { "X-Codex-Primary-Used-Percent": "" } },
    }).length,
    0,
  );
  assert.equal(poolSummary([{ provider: "codex" }]).known, 0);
});
test("Pools exclude disabled credentials from capacity and disclose unknown quotas", () => {
  const a = (n) => ({
    provider: "codex",
    quota: { signals: { "X-Codex-Primary-Used-Percent": String(n) } },
  });
  const summary = poolSummary([
    a(33),
    { ...a(0), disabled: true },
    { provider: "codex" },
  ]);
  assert.equal(summary.remaining, 67);
  assert.equal(summary.known, 1);
  assert.equal(summary.total, 2);
});
test("Provider aliases and untrusted account labels are normalized safely", () => {
  assert.equal(providerKey({ provider: "grok" }), "xai");
  assert.equal(
    escapeHTML('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  );
});

test("Next reset selects the earliest of multiple allowance windows", () => {
 const account = {normalizedQuota: {groups: [{buckets: [
 {window: "Weekly", remainingFraction: .99, resetTime: "2030-09-20T12:00:00Z"},
 {window: "5-hour", remainingFraction: .98, resetTime: "2030-09-15T12:00:00Z"}
 ]}]}};
 assert.equal(context.ProxyData.nextReset(account), "2030-09-15T12:00:00.000Z");
});
