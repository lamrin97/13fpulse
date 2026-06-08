import { useState, useMemo } from 'react'
import { FUNDS } from '../hooks/useFunds'
import { fmtValue } from '../lib/api'
import { Spinner } from './UI'

function heatCol(change) {
  if (change === 'new')  return '#176A3A'
  if (change === 'add')  return '#2A8A50'
  if (change === 'hold') return '#6B6B68'
  if (change === 'trim') return '#C04040'
  if (change === 'exit') return '#7A1A1A'
  return '#d1d5db'
}

function dominantChange(funds) {
  const counts = { new: 0, add: 0, trim: 0, exit: 0, hold: 0 }
  funds.forEach(f => { counts[f.change] = (counts[f.change] || 0) + 1 })
  const bullish = counts.new + counts.add
  const bearish = counts.trim + counts.exit
  if (bullish > bearish) return counts.new >= counts.add ? 'new' : 'add'
  if (bearish > bullish) return counts.exit >= counts.trim ? 'exit' : 'trim'
  return 'hold'
}

export default function HeatmapTab({ tickers, fundData, onSelectTicker }) {
  const [view, setView] = useState('ticker')

  const views = [
    { id: 'ticker', label: 'By ticker' },
    { id: 'fund',   label: 'By fund' },
  ]

  const enriched = useMemo(() => tickers.map(t => ({
    ...t,
    dominant: dominantChange(t.funds),
    activeFunds: t.funds.filter(f => f.change !== 'exit').length,
  })).slice(0, 32), [tickers])

  const allLoading = FUNDS.every(f => fundData[f.id]?.loading)

  if (allLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
      <Spinner size={28} />
      <span style={{ fontSize: 12, color: '#6b7280' }}>Loading filings...</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 3, padding: '8px 12px', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0, background: '#f9fafb' }}>
        {views.map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{ flex: 1, border: view === v.id ? '0.5px solid #0C447C' : '0.5px solid #e5e7eb', borderRadius: 6, padding: '5px 4px', fontSize: 11, background: view === v.id ? '#0C447C' : '#fff', color: view === v.id ? '#fff' : '#6b7280', fontWeight: view === v.id ? 500 : 400, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '5px 12px', flexShrink: 0, borderBottom: '0.5px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[['#176A3A','New buy'],['#2A8A50','Adding'],['#6B6B68','Hold'],['#C04040','Trimming'],['#7A1A1A','Exited']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />{l}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {view === 'ticker' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
            {enriched.map(t => {
              const col = heatCol(t.dominant)
              return (
                <div key={t.nameOfIssuer} onClick={() => onSelectTicker(t)}
                  style={{ background: col, borderRadius: 5, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 52, border: '1px solid rgba(255,255,255,0.12)', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)', lineHeight: 1 }}>{t.nameOfIssuer.split(' ')[0].slice(0, 6)}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{t.activeFunds} fund{t.activeFunds !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{fmtValue(t.totalValue)}</span>
                </div>
              )
            })}
          </div>
        )}

        {view === 'fund' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FUNDS.map(fund => {
              const fd = fundData[fund.id]
              if (!fd || fd.loading) return (
                <div key={fund.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb', fontSize: 11, color: '#6b7280' }}>
                  Loading {fund.name}...
                </div>
              )
              if (fd.error) return (
                <div key={fund.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb', fontSize: 11, color: '#9ca3af' }}>
                  {fund.name} — {fd.error}
                </div>
              )
              return (
                <div key={fund.id} style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid #e5e7eb' }}>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: fund.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#111827', flex: 1 }}>{fund.name}</span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{fd.period || fd.filed || ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8 }}>
                    {(fd.holdings || []).slice(0, 16).map((h, i) => {
                      const col = heatCol(h.change || 'hold')
                      return (
                        <div key={i} style={{ background: col, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', minWidth: 52 }}
                          onClick={() => {
                            const ticker = tickers.find(t => t.nameOfIssuer.toUpperCase() === h.nameOfIssuer.toUpperCase())
                            if (ticker) onSelectTicker(ticker)
                          }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>{h.nameOfIssuer.split(' ')[0].slice(0, 6)}</div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>{fmtValue(h.value || h.currentValue || 0)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
