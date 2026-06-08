import { useState, useEffect } from 'react';
import { loadFundData, resolveTickerSymbol } from '../lib/api';

// Aggregates per-fund diffs into a ticker-keyed map, then returns a sorted array.
// BUG 4 FIX: Each ticker.funds[] entry now carries currentPeriod, priorPeriod, filed
// so TickerDetail can display dynamic period labels instead of hardcoded strings.

export function useFunds() {
  const [tickers, setTickers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const fundResults = await loadFundData();

        // Map: issuerName (uppercase) → ticker object
        const tickerMap = new Map();

        for (const result of fundResults) {
          if (result.error) continue;

          for (const holding of result.holdings) {
            const key = holding.nameOfIssuer.trim().toUpperCase();

            if (!tickerMap.has(key)) {
              tickerMap.set(key, {
                name:      holding.nameOfIssuer,
                sym:       null,          // resolved async below
                value:     0,
                funds:     [],
                directions: new Set(),
              });
            }

            const t = tickerMap.get(key);
            t.value += holding.value;
            t.directions.add(holding.direction);
            t.funds.push({
              fund:          result.fund,
              cik:           result.cik,
              // BUG 4 FIX: real period strings from api.js
              currentPeriod: result.currentPeriod,
              priorPeriod:   result.priorPeriod,
              // BUG 5 FIX: actual filing date for price performance lookback
              filed:         result.filingDate,
              direction:     holding.direction,
              changePct:     holding.changePct,
              value:         holding.value,
              shares:        holding.shares,
              priorShares:   holding.priorShares,
              priorValue:    holding.priorValue,
            });
          }
        }

        // Convert to array, sort by total value desc
        const arr = Array.from(tickerMap.values()).sort((a, b) => b.value - a.value);

        if (!cancelled) {
          setTickers(arr);
          setLoading(false);
        }

        // Resolve ticker symbols in background (BUG 2 FIX)
        for (const t of arr) {
          resolveTickerSymbol(t.name).then(sym => {
            if (!cancelled && sym) {
              setTickers(prev =>
                prev.map(item =>
                  item.name === t.name ? { ...item, sym } : item
                )
              );
            }
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  return { tickers, loading, error };
}
