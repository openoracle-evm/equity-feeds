// Pure helpers: turn Pyth's /v2/price_feeds response into stable, sorted JSON.

/** "Equity.US.NVDA/USD" → { market: "US", ticker: "NVDA", quote: "USD" } */
export function parseSymbol(symbol) {
  const [base, quote = ""] = symbol.split("/");
  const parts = base.split(".");
  if (parts[0] !== "Equity" || parts.length < 3) return null;
  return { market: parts[1], ticker: parts.slice(2).join("."), quote };
}

/** Normalise one feed. Volatile fields (live market status) are dropped so the data only changes when feeds do. */
export function normalizeFeed(raw) {
  const a = raw.attributes ?? {};
  if (a.asset_type !== "Equity" || !a.symbol) return null;
  const parsed = parseSymbol(a.symbol);
  if (!parsed) return null;
  const schedule = a.schedule ?? null;
  return {
    id: "0x" + String(raw.id).replace(/^0x/, "").toLowerCase(),
    symbol: a.symbol,
    market: parsed.market,
    ticker: parsed.ticker,
    name: a.display_symbol ?? a.description ?? parsed.ticker,
    quote: a.quote_currency ?? parsed.quote,
    timeZone: schedule ? schedule.split(";")[0] : null,
    schedule,
  };
}

export function buildDataset(rawFeeds) {
  const feeds = rawFeeds
    .map(normalizeFeed)
    .filter(Boolean)
    .sort((x, y) => x.market.localeCompare(y.market) || x.ticker.localeCompare(y.ticker) || x.symbol.localeCompare(y.symbol));

  const markets = {};
  for (const f of feeds) (markets[f.market] ??= []).push(f);

  // US regular-session feeds only: "Equity.US.NVDA/USD" (no suffixes like .PRE/.POST/.ON)
  const usTickers = {};
  for (const f of markets.US ?? []) {
    if (f.quote === "USD" && /^[A-Z0-9.\-]+$/.test(f.ticker) && !/\.(PRE|POST|ON)$/.test(f.ticker) && !(f.ticker in usTickers)) {
      usTickers[f.ticker] = f.id;
    }
  }

  const summary = Object.entries(markets)
    .map(([market, list]) => ({ market, feeds: list.length, timeZone: list[0].timeZone }))
    .sort((a, b) => b.feeds - a.feeds);

  return { feeds, markets, usTickers, summary };
}

/** Markdown table for the README between <!-- summary:start --> and <!-- summary:end -->. */
export function summaryTable(summary, total) {
  const rows = summary.map((s) => `| \`${s.market}\` | ${s.feeds} | ${s.timeZone ?? "—"} | [\`markets/${s.market}.json\`](data/markets/${s.market}.json) |`);
  return [`**${total} feeds** across ${summary.length} markets.`, "", "| Market | Feeds | Time zone | File |", "|---|---:|---|---|", ...rows].join("\n");
}

export function replaceBetween(text, start, end, content) {
  const i = text.indexOf(start), j = text.indexOf(end);
  if (i < 0 || j < 0 || j < i) throw new Error(`markers ${start} … ${end} not found`);
  return text.slice(0, i + start.length) + "\n" + content + "\n" + text.slice(j);
}
