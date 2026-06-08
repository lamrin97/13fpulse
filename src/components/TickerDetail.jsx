import { useState, useEffect } from 'react'
import { getFundamentals, getTickerNews, getHistoricalPrice, resolveSymbol, fmtValue, fmtNetValue } from '../lib/api'
import { Spinner, InfoTooltip } from './UI'

const TIPS = {
  perf:  'How much the stock price has moved since the filing deadline.',
  trpe:  'Price divided by last 12 months of actual earnings. Below 20 is cheap; above 35 is expensive.',
  fwpe:  'Uses next year\'s estimated earnings. Much lower than trailing PE = analysts expect fast profit growth.',
  peg:   'PE divided by growth rate. Below 1.2 = good value for growth. Above 2.0 = paying a premium.',
  conv:  'How strongly big funds agree on direction this quarter. Based on real QoQ share changes.',
  pt:    'Average 12-month price target set by Wall Street analysts.',
  mcap:  'Total market value of all shares. $1T+ = mega cap. $100B–$1T = large cap.',
  funds: 'Per-fund positions from official SEC 13F filings, compared to prior quarter.',
}

export default function TickerDetail({ ticker, onBack, watchlist, onToggleWatch }) {
  const [tab, setTab]     = useState('funds')
  const [fund, setFund]   = useState(null)
  const [news, setNews]   = useState([])
  const [spark, setSpark] = useState([])
  const [sym, setSym]     = useState('')
  const [loadingF, setLF] = useState(true)
  const [loadingN, setLN] = useState(true)

  const name    = ticker?.nameOfIssuer || ''
  const inWatch = watchlist.includes(name)

  const filingDate    = ticker?.funds?.map(f => f.filed).filter(Boolean).sort().pop() || ''
  const currentPeriod = ticker?.funds?.find(f => f.period)?.period || 'Current'
  const priorPeriod   = ticker?.funds?.find(f => f.priorPeriod)?.priorPeriod || 'Prior'

  useEffect(() => {
    if (!ticker) return
    setLF(true); setLN(true); setSym(''); setFund(null); setNews([]); setSpark([])
    resolveSymbol(name, ticker?.cusip || '').then(s => {
      setSym(s)
      getFundamentals(s).then(d => { setFund(d); setLF(false) }).catch(() => setLF(false))
      getTickerNews(s).then(d => { setNews(d); setLN(false) }).catch(() => setLN(false))
      if (filingDate) getHistoricalPrice(s, filingDate).then(setSpark).catch(() => setSpark([]))
    })
  }, [ticker])

  if (!ticker) return null

  const perfVal = spark.length >= 2 ? ((spark[spark.length - 1] - spark[0]) / spark[0] * 100) : null
  const perfPos = perfVal !== null ? perfVal >= 0 : true
  const sortedFunds = (ticker.funds || []).sort((a, b) => b.currentValue - a.currentValue)

  const newBuys = sortedFunds.filter(f => f.change === 'new').length
  const adds    = sortedFunds.filter(f => f.change === 'add').length
  const holds   = sortedFunds.filter(f => f.change === 'hold').length
  const trims   = sortedFunds.filter(f => f.change === 'trim').length
  const exits   = sortedFunds.filter(f => f.change === 'exit').length
  const active  = sortedFunds.filter(f => f.change !== 'exit').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#fff' }}>

      {/* Header */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#6b7280', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827' }}>{sym || name.split(' ')[0]}</div>
        <button onClick={() => onToggleWatch(name)} style={{ width: 28, height: 28, borderRadius: '50%', border: inWatch ? '0.5px solid #97C459' : '0.5px solid #e5e7eb', background: inWatch ? '#EAF3DE' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: inWatch ? '#27500A' : '#6b7280', flexShrink: 0 }}>
          {inWatch ? '★' : '☆'}
        </button>
      </div>

      {/* Price hero */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>{sym || '—'}</div>
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
          {newBuys > 0 && <span style={{ fontSize: 10, background: '#D1FAE5', color: '#065F46', borderRadius: 12, padding: '2px 8px', fontWeight: 500 }}>🆕 {newBuys} new</span>}
          {adds   > 0 && <span style={{ fontSize: 10, background: '#EAF3DE', color: '#27500A', borderRadius: 12, padding: '2px 8px', fontWeight: 500 }}>▲ {adds} adding</span>}
          {trims  > 0 && <span style={{ fontSize: 10, background: '#FEF9C3', color: '#854D0E', borderRadius: 12, padding: '2px 8px', fontWeight: 500 }}>▼ {trims} trimming</span>}
          {exits  > 0 && <span style={{ fontSize: 10, background: '#FCEBEB', color: '#791F1F', borderRadius: 12, padding: '2px 8px', fontWeight: 500 }}>✕ {exits} exited</span>}
          <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', borderRadius: 12, padding: '2px 8px' }}>{active} fund{active !== 1 ? 's' : ''}</span>
          {fund?.mcap && <span style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', borderRadius: 12, padding: '2px 8px' }}>${(fund.mcap / 1e9).toFixed(0)}B cap</span>}
        </div>

        {perfVal !== null && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: spark.length > 0 ? 6 : 0 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: perfPos ? '#3B6D11' : '#A32D2D' }}>
              {perfPos ? '+' : ''}{perfVal.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>since {filingDate}</span>
            <InfoTooltip text={TIPS.perf} />
          </div>
        )}

        {spark.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 28, width: '100%', marginTop: 6 }}>
            {spark.map((v, i) => {
              const max = Math.max(...spark), min = Math.min(...spark), range = max - min || 1
              const h = Math.max(3, Math.round(((v - min) / range) * 24) + 4)
              return <div key={i} style={{ flex: 1, minWidth: 1, maxWidth: 12, height: h, background: perfPos ? '#639922' : '#E24B4A', opacity: 0.3 + 0.7 * ((v - min) / range), borderRadius: '2px 2px 0 0' }} />
            })}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0 }}>
        {[{id:'funds',label:'Funds'},{id:'fundamentals',label:'Fundamentals'},{id:'news',label:'News'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 4px', textAlign: 'center', fontSize: 12, background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #185FA5' : '2px solid transparent', color: tab === t.id ? '#185FA5' : '#6b7280', fontWeight: tab === t.id ? 500 : 400, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* FUNDS TAB */}
        {tab === 'funds' && (
          <div>
            {/* Fund rows */}
            <div style={{ padding: '11px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fund positions</span>
                <InfoTooltip text={TIPS.funds} />
              </div>
              {sortedFunds.map((f, i) => {
                const isNew  = f.change === 'new'
                const isExit = f.change === 'exit'
                const isAdd  = !isNew && f.shareDelta > 0
                const isTrim = f.shareDelta < 0
                const chgBg    = isNew ? '#D1FAE5' : isExit ? '#FCEBEB' : isAdd ? '#EAF3DE' : isTrim ? '#FEF9C3' : '#f3f4f6'
                const chgColor = isNew ? '#065F46' : isExit ? '#791F1F' : isAdd ? '#27500A' : isTrim ? '#854D0E' : '#6b7280'
                const chgLabel = isNew  ? '🆕 New position' :
                                 isExit ? '✕ Exited' :
                                 isAdd  ? `▲ +${(f.shareDelta / 1e6).toFixed(2)}M shs` :
                                 isTrim ? `▼ ${(f.shareDelta / 1e6).toFixed(2)}M shs` : '— Unchanged'
                return (
                  <div key={f.fundId} style={{ padding: '10px 0', borderBottom: i < sortedFunds.length - 1 ? '0.5px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#f9fafb', border: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>
                        {f.fundName.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#111827' }}>{f.fundName}</div>
                      <span style={{ fontSize: 10, background: chgBg, color: chgColor, borderRadius: 5, padding: '2px 7px', fontWeight: 500 }}>{chgLabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, paddingLeft: 34 }}>
                      {!isNew && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2 }}>{priorPeriod}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{f.priorShares ? (f.priorShares / 1e6).toFixed(2) + 'M shs' : '—'}</div>
                          {f.priorValue > 0 && <div style={{ fontSize: 10, color: '#9ca3af' }}>{fmtValue(f.priorValue)}</div>}
                        </div>
                      )}
                      {!isExit && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2 }}>{currentPeriod}</div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{(f.currentShares / 1e6).toFixed(2)}M shs</div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>{fmtValue(f.currentValue)} held</div>
                          {f.shareDelta !== 0 && (
                            <div style={{ fontSize: 10, fontWeight: 500, color: f.shareDelta > 0 ? '#27500A' : '#791F1F', marginTop: 1 }}>
                              {fmtNetValue(f.shareDelta, f.currentValue, f.currentShares)} net
                            </div>
                          )}
                        </div>
                      )}
                      {isExit && (
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2 }}>Was holding</div>
                          <div style={{ fontSize: 11, color: '#791F1F' }}>{f.priorShares ? (f.priorShares / 1e6).toFixed(2) + 'M shs' : '—'}</div>
                          <div style={{ fontSize: 10, color: '#791F1F' }}>Fully exited</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* QoQ trend bar chart */}
            <div style={{ padding: '11px 16px', borderTop: '0.5px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accumulation trend</span>
              </div>
              {/* Bar chart — Q4 2025 vs Q1 2026 with real data, placeholders for prior quarters */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 80 }}>
                {[
                  { q: priorPeriod  || "Q4'25", buys: sortedFunds.filter(f => !['new','exit'].includes(f.change)).length, sells: sortedFunds.filter(f => f.change === 'trim').length, cur: false },
                  { q: currentPeriod || "Q1'26", buys: sortedFunds.filter(f => f.change === 'new' || f.change === 'add').length, sells: sortedFunds.filter(f => f.change === 'exit').length, cur: true },
                ].map((bar, i) => {
                  const maxH = 60
                  const bh = Math.max(4, Math.round((bar.buys / Math.max(sortedFunds.length, 1)) * maxH))
                  const sh = Math.max(4, Math.round((bar.sells / Math.max(sortedFunds.length, 1)) * maxH))
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, outline: bar.cur ? '1.5px solid #185FA5' : 'none', borderRadius: 4, padding: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
                        <div style={{ width: 18, height: bh, background: bar.buys ? '#2A8A50' : '#e5e7eb', borderRadius: '3px 3px 0 0', opacity: bar.buys ? 1 : 0.3 }} />
                        <div style={{ width: 18, height: sh, background: bar.sells ? '#C04040' : '#e5e7eb', borderRadius: '3px 3px 0 0', opacity: bar.sells ? 1 : 0.3 }} />
                      </div>
                      <div style={{ fontSize: 9, color: bar.cur ? '#185FA5' : '#9ca3af', fontWeight: bar.cur ? 600 : 400 }}>{bar.q}</div>
                      <div style={{ fontSize: 8, color: '#6b7280' }}>
                        {bar.buys > 0 && <span style={{ color: '#2A8A50' }}>▲{bar.buys} </span>}
                        {bar.sells > 0 && <span style={{ color: '#C04040' }}>▼{bar.sells}</span>}
                        {!bar.buys && !bar.sells && <span>—</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#6b7280' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#2A8A50' }} />Buying/Adding
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#6b7280' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#C04040' }} />Trimming/Exiting
                </div>
                <div style={{ border: '1px solid #185FA5', borderRadius: 3, padding: '0 4px', fontSize: 8, color: '#185FA5' }}>current</div>
              </div>
            </div>
          </div>
        )}

        {/* FUNDAMENTALS TAB */}
        {tab === 'fundamentals' && (
          <div>
            {loadingF ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
            ) : !fund ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
                Fundamentals unavailable for {sym || name}
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e5e7eb' }}>
                  {[
                    { label: 'Trailing PE', val: fund.trPE?.toFixed(1) || '—', sub: 'vs S&P avg ~22', tip: 'trpe' },
                    { label: 'Forward PE',  val: fund.fwPE?.toFixed(1) || '—', sub: 'consensus est.',  tip: 'fwpe' },
                    { label: 'PEG ratio',   val: fund.peg?.toFixed(1)  || '—', sub: fund.peg < 1.2 ? 'Attractive' : fund.peg < 2 ? 'Fair' : 'Elevated', color: fund.peg < 1.2 ? '#27500A' : fund.peg < 2 ? '#633806' : '#791F1F', tip: 'peg' },
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
                </div>
                {fund.ptTarget && (
                  <div style={{ padding: '11px 16px', background: '#f9fafb', borderTop: '0.5px solid #e5e7eb' }}>
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
              </div>
            )}
          </div>
        )}

        {/* NEWS TAB */}
        {tab === 'news' && (
          <div>
            {loadingN ? (
              <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><Spinner /></div>
            ) : !news.length ? (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>No news found for {sym || name}</div>
            ) : (
              news.map((n, i) => {
                const tagCls   = n.sentiment === 'Positive' ? 'buy-pill' : n.sentiment === 'Negative' ? 'sell-pill' : 'neu-pill'
                const tagLabel = n.sentiment === 'Positive' ? 'Bullish' : n.sentiment === 'Negative' ? 'Bearish' : 'Neutral'
                return (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', padding: '11px 16px', borderBottom: '0.5px solid #f3f4f6', textDecoration: 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{n.source}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>{n.time ? new Date(n.time).toLocaleDateString() : ''}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', lineHeight: 1.4, marginBottom: 3 }}>{n.headline}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 5 }}>{n.snippet}</div>
                    <span className={tagCls} style={{ fontSize: 9, borderRadius: 3, padding: '2px 6px', fontWeight: 500 }}>{tagLabel}</span>
                  </a>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  )
}
