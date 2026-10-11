# equity-feeds

**Open Oracle** · Every [Pyth](https://pyth.network) equity price feed as JSON: feed ids, symbols, exchanges and trading-hour schedules. Refreshed every day by a GitHub Action.

Stop copying feed ids by hand. Look up a ticker, get its id and its market hours.

<!-- summary:start -->
**1251 feeds** across 8 markets.

| Market | Feeds | Time zone | File |
|---|---:|---|---|
| `US` | 1051 | America/New_York | [`markets/US.json`](data/markets/US.json) |
| `HK` | 107 | Asia/Hong_Kong | [`markets/HK.json`](data/markets/HK.json) |
| `Index` | 33 | America/New_York | [`markets/Index.json`](data/markets/Index.json) |
| `JP` | 21 | Asia/Tokyo | [`markets/JP.json`](data/markets/JP.json) |
| `KR` | 18 | Asia/Seoul | [`markets/KR.json`](data/markets/KR.json) |
| `CN` | 14 | Asia/Shanghai | [`markets/CN.json`](data/markets/CN.json) |
| `TW` | 6 | Asia/Taipei | [`markets/TW.json`](data/markets/TW.json) |
| `IN` | 1 | Asia/Kolkata | [`markets/IN.json`](data/markets/IN.json) |
<!-- summary:end -->

## Files

| File | Contents |
|---|---|
| [`data/feeds.json`](data/feeds.json) | All equity feeds: `id`, `symbol`, `market`, `ticker`, `name`, `quote`, `timeZone`, `schedule` |
| [`data/us-tickers.json`](data/us-tickers.json) | `{ "NVDA": "0xb107…a593", … }` — US regular-session USD feeds by ticker |
| [`data/markets/<MARKET>.json`](data/markets) | Feeds for one market (`US`, `HK`, `JP`, …) |
| [`data/summary.json`](data/summary.json) | Feed count per market |

Each feed:

```json
{
  "id": "0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
  "symbol": "Equity.US.NVDA/USD",
  "market": "US",
  "ticker": "NVDA",
  "name": "NVDA",
  "quote": "USD",
  "timeZone": "America/New_York",
  "schedule": "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C;…"
}
```

The `schedule` string is Pyth's market-hours format. [`oracle-sdk`](https://github.com/openoracle-evm/oracle-sdk) parses it (`isMarketOpen`, `marketStatus`).

## Use it

**Raw URL, no install:**

```ts
const tickers = await fetch("https://raw.githubusercontent.com/openoracle-evm/equity-feeds/main/data/us-tickers.json").then((r) => r.json());
tickers.NVDA; // "0xb107…a593"
```

**From GitHub with npm:**

```bash
npm install github:openoracle-evm/equity-feeds
```

```ts
import tickers from "@openoracle/equity-feeds/tickers" with { type: "json" };
```

## How it updates

[`.github/workflows/update.yml`](.github/workflows/update.yml) runs daily at 06:00 UTC, calls Pyth's public `/v2/price_feeds?asset_type=equity` endpoint (no API key), and commits only when feeds change. Live market status is left out so the data stays stable between real changes.

Run it yourself:

```bash
npm run update   # Node 20+, no dependencies
npm test
```

## License

MIT. Feed data comes from Pyth Network; see Pyth's terms for its use.
