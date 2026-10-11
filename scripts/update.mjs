// Fetches every Pyth equity feed and rewrites data/ and the README summary.
// Public endpoint — no API key needed.   node scripts/update.mjs
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { buildDataset, replaceBetween, summaryTable } from "./lib.mjs";

const ENDPOINT = process.env.PYTH_ENDPOINT ?? "https://hermes.pyth.network";
const res = await fetch(`${ENDPOINT}/v2/price_feeds?asset_type=equity`, { signal: AbortSignal.timeout(30_000) });
if (!res.ok) throw new Error(`Pyth responded ${res.status}`);
const raw = await res.json();
if (!Array.isArray(raw) || raw.length < 100) throw new Error(`Unexpected response (${Array.isArray(raw) ? raw.length : typeof raw} feeds) — refusing to overwrite data`);

const { feeds, markets, usTickers, summary } = buildDataset(raw);
const json = (v) => JSON.stringify(v, null, 2) + "\n";

await rm("data/markets", { recursive: true, force: true });
await mkdir("data/markets", { recursive: true });
await writeFile("data/feeds.json", json(feeds));
await writeFile("data/us-tickers.json", json(usTickers));
await writeFile("data/summary.json", json(summary));
for (const [market, list] of Object.entries(markets)) await writeFile(`data/markets/${market}.json`, json(list));

const readme = await readFile("README.md", "utf8");
await writeFile("README.md", replaceBetween(readme, "<!-- summary:start -->", "<!-- summary:end -->", summaryTable(summary, feeds.length)));

console.log(`${feeds.length} feeds · ${summary.length} markets · ${Object.keys(usTickers).length} US tickers`);
