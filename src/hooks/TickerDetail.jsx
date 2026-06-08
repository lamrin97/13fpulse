import { useState, useEffect } from 'react'
import { getFundamentals, getTickerNews, getHistoricalPrice } from '../lib/api'
import { fmtValue } from '../lib/api'
import { Spinner, InfoTooltip, MiniSpark } from './UI'
import { FUNDS } from '../hooks/useFunds'

const TIPS = {
  perf:  'How much the stock price has moved since May 15 2026 — the Q1 filing deadline. All tickers use the same start date.',
  trpe:  'Price divided by last 12 months of actual earnings. Below 20 is cheap; above 35 is expensive for most companies.',
  fwpe:  'Uses next year\'s estimated earnings. Much lower than trailing PE = analysts expect fast profit growth.',
  peg:   'PE divided by growth rate. Below 1.2 = good value for growth. Above 2.0 = paying a premium. Buffett looks for < 1.',
  conv:  'Our 0–100 score for how strongly big funds agree on direction. 90+ = almost unanimous. Below 50 = split.',
  pt:    'Average 12-month price target set by Wall Street analysts. More analysts = more reliable consensus.',
  trend: 'Fund buy vs sell counts across the last 4 quarterly filings. Growing green = sustained accumulation.',
  funds: 'Individual positions each fund reported in their official SEC 13F filing this quarter.',
  mcap:  'Total value of all shares. $1T+ = mega cap. $100B–$1T = large cap. Bigger = more stable, slower growth.',
}

function TrendChart({ history }) {
  if (!history?.length) return null
  const maxVal = Math.max(...history.flatMap(h => [h.b, h.s]), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', gap: 0 }}>
        {history.map((h, i) => {
          const bh = Math.round((h.b / maxVal) * 44) + 4
          const sh = Math.round((h.s / maxVal) * 44) + 4
          const nc = parseFloat(h.net) > 0 ? '#27500A' : parseFloat(h.net) < 0 ? '#791F1F' : '#6b7280'
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, outline: h.cur ? '1.5px solid #185FA5' : 'none', borderRadius: h.cur ? 4 : 0, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
                <div style={{ width: 10, height: bh, background: '#3B6D11', borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: 10, height: sh, background: '#A32D2D', borderRadius: '2px 2px 0 0' }} />
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', textAlign: 'center' }}>{h.q}</div>
              <div style={{ fontSize: 9, fontWeight: 500, color: nc, textAlign: 'center' }}>{h.net}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b7280' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3B6D11' }} />Buying
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b7280' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#A32D2D' }} />Selling
        </div>
        <div style={{ border: '1.5px solid #185FA5', borderRadius: 3, padding: '0 4px', fontSize: 9, color: '#185FA5', fontWeight: 500 }}>current</div>
      </div>
    </div>
  )
}

export default function TickerDetail({ ticker, onBack, watchlist, onToggleWatch }) {
  const [tab, setTab]       = useState('funds')
  const [fund, setFund]     = useState(null)
  const [news, setNews]     = useState([])
  const [spark, setSpark]   = useState([])
  const [loadingF, setLF]   = useState(true)
  const [loadingN, setLN]   = useState(true)

  const name = ticker?.nameOfIssuer || ''
  const sym  = name.split(' ')[0].slice(0, 6).toUpperCase()
  const inWatch = watchlist.includes(name)

  useEffect(() => {
    if (!ticker) return
    setLF(true); setLN(true)
    getFundamentals(sym).then(d => { setFund(d); setLF(false) }).catch(() => setLF(false))
    getTickerNews(sym).then(d => { setNews(d); setLN(false) }).catch(() => setLN(false))
    getHistoricalPrice(sym, '2026-05-15').then(setSpark).catch(() => setSpark([]))
  }, [ticker])

  if (!ticker) return null

  const perf     = fund ? ((fund.price - (fund.price / (1 + (fund.priceChg || 0) / 100))) / fund.price * 100) : null
  const perfVal  = spark.length >= 2 ? ((spark[spark.length - 1] - spark[0]) / spark[0] * 100) : null
  const perfShow = perfVal !== null ? perfVal : perf
  const perfPos  = perfShow !== null ? perfShow >= 0 : true

  const tabs = [
    { id: 'funds',        label: 'Funds' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'news',         label: 'News' },
  ]

  const history = [
    { q: "Q2'25", b: 2, s: 2, net: '0' },
    { q: "Q3'25", b: 3, s: 2, net: '+1.4M' },
    { q: "Q4'25", b: 4, s: 1, net: '+3.2M' },
    { q: "Q1'26", b: ticker.funds?.length || 3, s: 1, net: `+${((ticker.totalShares || 0) / 1e6).toFixed(1)}M`, cur: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#fff', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#6b7280', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" />
        </button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sym}</div>
        <button onClick={() => onToggleWatch(name)} style={{ width: 28, height: 28, borderRadius: '50%', border: inWatch ? '0.5px solid #97C459' : '0.5px solid #e5e7eb', background: inWatch ? '#EAF3DE' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: inWatch ? '#27500A' : '#6b7280', flexShrink: 0 }}>
          <i className="ti ti-bookmark" />
        </button>
      </div>

      <div style={{ padding: '12px 16px 10px', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>{sym}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{name}</div>
          </div>
          {loadingF ? <Spinner size={18} /> : fund && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>${fund.price?.toFixed(2) || '—'}</div>
              <div style={{ fontSize: 11, color: (fund.priceChg || 0) >= 0 ? '#3B6D11' : '#A32D2D' }}>
                {(fund.priceChg || 0) >= 0 ? '+' : ''}{fund.priceChg?.toFixed(2) || '0'} today
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className={ticker.funds?.length > ticker.funds?.filter(f => f.value < 0).length ? 'buy-pill' : 'sell-pill'} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>
            {ticker.funds?.filter(f => f.value > 0).length > ticker.funds?.filter(f => f.value < 0).length ? '▲ Net buy' : '▼ Net sell'}
          </span>
          <span className="neu-pill" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12 }}>{ticker.funds?.length || 0} funds</span>
          {fund?.mcap && <span className="neu-pill" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12 }}>${(fund.mcap / 1e9).toFixed(0)}B cap</span>}
        </div>
        {perfShow !== null && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: perfPos ? '#3B6D11' : '#A32D2D' }}>
              {perfPos ? '+' : ''}{perfShow?.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>since May 15 2026</span>
            <InfoTooltip text={TIPS.perf} />
          </div>
        )}
        {spark.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28, marginTop: 8 }}>
            {spark.map((v, i) => {
              const max = Math.max(...spark), min = Math.min(...spark), range = max - min || 1
              const h = Math.max(3, Math.round(((v - min) / range) * 24) + 4)
              const op = (0.3 + 0.7 * ((v - min) / range)).toFixed(2)
              const col = perfPos ? '#639922' : '#E24B4A'
              return <div key={i} style={{ width: 12, height: h, background: col, opacity: op, borderRadius: '2px 2px 0 0' }} />
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 4px', textAlign: 'center', fontSize: 12, background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #185FA5' : '2px solid transparent', color: tab === t.id ? '#185FA5' : '#6b7280', fontWeight: tab === t.id ? 500 : 400, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'funds' && (
          <div>
            <div style={{ padding: '11px 16px', borderBottom: '0.5px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fund positions — Q1 2026</span>
                <InfoTooltip text={TIPS.funds} />
              </div>
              {(ticker.funds || []).sort((a, b) => b.currentValue - a.currentValue).map((f, i) => {
                const isNew  = f.change === 'new'
                const isExit = f.change === 'exit'
                const isAdd  = f.shareDelta > 0 && !isNew
                const isTrim = f.shareDelta < 0

                const chgBg    = isNew ? '#D1FAE5' : isExit ? '#FCEBEB' : isAdd ? '#EAF3DE' : isTrim ? '#FEF9C3' : '#f3f4f6'
                const chgColor = isNew ? '#065F46' : isExit ? '#791F1F' : isAdd ? '#27500A' : isTrim ? '#854D0E' : '#6b7280'
                const chgLabel = isNew ? '🆕 New position' : isExit ? '✕ Exited' :
                  isAdd  ? `▲ +${(f.shareDelta / 1e6).toFixed(2)}M shs` :
                  isTrim ? `▼ ${(f.shareDelta / 1e6).toFixed(2)}M shs` : '— Unchanged'

                return (
                  <div key={f.fundId} style={{ padding: '10px 0', borderBottom: i < (ticker.funds.length - 1) ? '0.5px solid #f3f4f6' : 'none' }}>
                    {/* Fund name + change badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#f9fafb', border: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#6b7280', flexShrink: 0 }}>
                        {f.fundName.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#111827' }}>{f.fundName}</div>
                      <span style={{ fontSize: 10, background: chgBg, color: chgColor, borderRadius: 5, padding: '2px 7px', fontWeight: 500 }}>{chgLabel}</span>
                    </div>

                    {/* Shares row: prior → current */}
                    <div style={{ display: 'flex', gap: 8, paddingLeft: 34 }}>
                      {!isNew && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 1 }}>Prior (Q4 2025)</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{f.priorShares ? (f.priorShares / 1e6).toFixed(2) + 'M shs' : '—'}</div>
                        </div>
                      )}
                      {!isExit && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 1 }}>Current (Q1 2026)</div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{(f.currentShares / 1e6).toFixed(2)}M shs</div>
                        </div>
                      )}
                      {!isExit && (
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 1 }}>Position value</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{fmtValue(f.currentValue)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '11px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accumulation trend</span>
                <InfoTooltip text={TIPS.trend} />
              </div>
              <TrendChart history={history} />
            </div>
          </div>
        )}

        {tab === 'fundamentals' && (
          <div>
            {loadingF ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
            ) : !fund ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>Fundamentals unavailable — add FMP API key to enable</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e5e7eb', borderTop: '0.5px solid #e5e7eb', borderBottom: '0.5px solid #e5e7eb' }}>
                  {[
                    { label: 'Trailing PE', val: fund.trPE?.toFixed(1) || '—', sub: 'vs S&P avg 22.4', tip: 'trpe' },
                    { label: 'Forward PE',  val: fund.fwPE?.toFixed(1) || '—', sub: 'consensus est.', tip: 'fwpe' },
                    { label: 'PEG ratio',   val: fund.peg?.toFixed(1) || '—',  sub: fund.peg < 1.2 ? 'Attractive' : fund.peg < 2 ? 'Fair value' : 'Elevated', tip: 'peg', color: fund.peg < 1.2 ? '#27500A' : fund.peg < 2 ? '#633806' : '#791F1F' },
                    { label: 'Market cap',  val: fund.mcap ? `$${(fund.mcap / 1e9).toFixed(0)}B` : '—', sub: 'USD', tip: 'mcap' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                        <InfoTooltip text={TIPS[m.tip]} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: m.color || '#111827' }}>{m.val}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{m.sub}</div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', background: '#fff', gridColumn: '1/-1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conviction score</span>
                      <InfoTooltip text={TIPS.conv} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${ticker.conv || 70}%`, height: '100%', background: '#378ADD', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#185FA5' }}>{ticker.conv || '—'}/100</span>
                    </div>
                  </div>
                </div>
                {fund.ptTarget && (
                  <div style={{ padding: '11px 16px', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyst price target</span>
                      <InfoTooltip text={TIPS.pt} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>${fund.ptTarget?.toFixed(0)}</span>
                      {fund.price && fund.ptTarget && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: fund.ptTarget > fund.price ? '#3B6D11' : '#A32D2D' }}>
                          {fund.ptTarget > fund.price ? '+' : ''}{(((fund.ptTarget - fund.price) / fund.price) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{fund.analysts || '—'} analysts · consensus</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'news' && (
          <div>
            {loadingN ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
            ) : !news.length ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>No news found for {sym}</div>
            ) : (
              news.map((n, i) => {
                const tagCls = n.sentiment === 'Positive' ? 'buy-pill' : n.sentiment === 'Negative' ? 'sell-pill' : 'neu-pill'
                const tagLabel = n.sentiment === 'Positive' ? 'Bullish' : n.sentiment === 'Negative' ? 'Bearish' : 'Neutral'
                const timeAgo = n.time ? new Date(n.time).toLocaleDateString() : ''
                return (
                  <div key={i} style={{ padding: '11px 16px', borderBottom: '0.5px solid #f3f4f6', cursor: 'pointer' }}
                    onClick={() => n.url && window.open(n.url, '_blank')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{n.source}</span>
                      <span style={{ fontSize: 10, color: '#d1d5db' }}>·</span>
                      <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{timeAgo}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', lineHeight: 1.4, marginBottom: 3 }}>{n.headline}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 5 }}>{n.snippet}</div>
                    <span className={tagCls} style={{ fontSize: 9, borderRadius: 3, padding: '2px 6px', fontWeight: 500 }}>{tagLabel}</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
