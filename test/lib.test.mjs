import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDataset, normalizeFeed, parseSymbol, replaceBetween, summaryTable } from "../scripts/lib.mjs";

const NY = "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C;1225/C";
const feed = (id, symbol, extra = {}) => ({ id, attributes: { asset_type: "Equity", symbol, display_symbol: symbol.split(".").pop().split("/")[0], quote_currency: symbol.split("/")[1], schedule: NY, ...extra }, market_hours: { is_open: true } });

test("parseSymbol splits market, ticker and quote", () => {
  assert.deepEqual(parseSymbol("Equity.US.NVDA/USD"), { market: "US", ticker: "NVDA", quote: "USD" });
  assert.deepEqual(parseSymbol("Equity.US.BRK.B/USD"), { market: "US", ticker: "BRK.B", quote: "USD" });
  assert.equal(parseSymbol("Crypto.BTC/USD"), null);
});

test("normalizeFeed adds 0x, lowercases ids and drops live market status", () => {
  const f = normalizeFeed(feed("ABCDEF", "Equity.US.NVDA/USD"));
  assert.equal(f.id, "0xabcdef");
  assert.equal(f.timeZone, "America/New_York");
  assert.equal("market_hours" in f, false);
  assert.equal(normalizeFeed({ id: "1", attributes: { asset_type: "Crypto", symbol: "Crypto.BTC/USD" } }), null);
});

test("buildDataset groups, sorts and builds the US ticker map", () => {
  const { feeds, markets, usTickers, summary } = buildDataset([
    feed("03", "Equity.US.TSLA/USD"),
    feed("01", "Equity.US.AAPL/USD"),
    feed("02", "Equity.US.AAPL.PRE/USD"),
    feed("04", "Equity.HK.0002/HKD", { schedule: "Asia/Hong_Kong;C,C,C,C,C,C,C" }),
    { id: "05", attributes: { asset_type: "Crypto", symbol: "Crypto.ETH/USD" } },
  ]);
  assert.equal(feeds.length, 4);
  assert.deepEqual(feeds.map((f) => f.symbol), ["Equity.HK.0002/HKD", "Equity.US.AAPL/USD", "Equity.US.AAPL.PRE/USD", "Equity.US.TSLA/USD"]);
  assert.deepEqual(usTickers, { AAPL: "0x01", TSLA: "0x03" });
  assert.equal(markets.US.length, 3);
  assert.deepEqual(summary[0], { market: "US", feeds: 3, timeZone: "America/New_York" });
});

test("summaryTable and replaceBetween update the README block", () => {
  const md = "a\n<!-- s -->\nold\n<!-- e -->\nb";
  const table = summaryTable([{ market: "US", feeds: 3, timeZone: "America/New_York" }], 3);
  const out = replaceBetween(md, "<!-- s -->", "<!-- e -->", table);
  assert.match(out, /\*\*3 feeds\*\* across 1 markets/);
  assert.match(out, /\| `US` \| 3 \|/);
  assert.ok(out.startsWith("a\n<!-- s -->\n") && out.endsWith("<!-- e -->\nb"));
  assert.throws(() => replaceBetween("no markers", "<!-- s -->", "<!-- e -->", "x"));
});
