import { useState, useMemo } from 'react'
import { Spinner } from './UI'
import { FUNDS } from '../hooks/useFunds'
import { fmtValue, fmtNetValue, secType } from '../lib/api'

const DIR_FILTERS = [
  { id: 'all',  label: 'All' },
  { id: 'new',  label: 'New buys' },
  { id: 'add',  label: 'Adding' },
  { id: 'trim', label: 'Trimming' },
  { id: 'exit', label: 'Exited' },
  { id: 'high', label: 'High conviction' },
]

const TYPE_FILTERS = [
  { id: 'all',    label: 'All types' },
  { id: 'Stock',  label: 'Stock' },
  { id: 'ETF',    label: 'ETF' },
  { id: 'Option', label: 'Option' },
  { id: 'Fund',   label: 'Fund' },
]

function dominantChange(funds) {
  const counts = { new: 0, add: 0, trim: 0, exit: 0, hold: 0 }
  funds.forEach(f => { counts[f.change] = (counts[f.change] || 0) + 1 })
  const bullish = counts.new + counts.add
  const bearish = counts.trim + counts.exit
  if (bullish > bearish) return bullish > 1 ? 'add' : 'new'
  if (bearish > bullish) return bearish > 1 ? 'trim' : 'exit'
  return 'hold'
}

function convScore(funds) {
  const active = funds.filter(f => f.change !== 'exit')
  if (!active.length) return 0
  const bullish = active.filter(f => f.change === 'new' || f.change === 'add').length
  return Math.round((bullish / active.length) * 100)
}

export default function GridTab({ tickers, fundData, watchlist, onToggleWatch, onSelectTicker }) {
  const [dirFilter,  setDirFilter]  = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search,     setSearch]     = useState('')
  const [sortCol,    setSortCol]    = useState('value')
  const [sortDir,    setSortDir]    = useState(-1)

  const allLoading = FUNDS.every(f => fundData[f.id]?.loading)
  const hasPrior   = FUNDS.some(f  => fundData[f.id]?.hasPrior)

  const enriched = useMemo(() => tickers.map(t => ({
    ...t,
    dominant: dominantChange(t.funds),
    conv:     convScore(t.funds),
    stype:    secType(t.nameOfIssuer),
    newBuys:  t.funds.filter(f => f.change === 'new').length,
    adds:     t.funds.filter(f => f.change === 'add').length,
    trims:    t.funds.filter(f => f.change === 'trim').length,
    exits:    t.funds.filter(f => f.change === 'exit').length,
    holds:    t.funds.filter(f => f.change === 'hold').length,
  })), [tickers])

  const sorted = useMemo(() => {
    let rows = [...enriched]
    if (dirFilter === 'new')  rows = rows.filter(r => r.newBuys > 0)
    if (dirFilter === 'add')  rows = rows.filter(r => r.adds > 0)
    if (dirFilter === 'trim') rows = rows.filter(r => r.trims > 0)
    if (dirFilter === 'exit') rows = rows.filter(r => r.exits > 0)
    if (dirFilter === 'high') rows = rows.filter(r => r.conv >= 75)
    if (typeFilter !== 'all') rows = rows.filter(r => r.stype === typeFilter)
    if (search) rows = rows.filter(r => r.nameOfIssuer.toLowerCase().includes(search.toLowerCase()))
    const colMap = {
      value: r => r.totalValue,
      conv:  r => r.conv,
      funds: r => r.newBuys + r.adds - r.trims - r.exits,
    }
    rows.sort((a, b) => sortDir * ((colMap[sortCol]?.(a) ?? 0) - (colMap[sortCol]?.(b) ?? 0)))
    return rows
  }, [enriched, dirFilter, typeFilter, search, sortCol, sortDir])

  const sortIcon = col => sortCol === col ? (sortDir === 1 ? ' ↑' : ' ↓') : ' ↕'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '7px 14px', borderBottom: '0.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>Q1 2026 · {sorted.length} tickers</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: hasPrior ? '#27500A' : '#633806', background: hasPrior ? '#EAF3DE' : '#FAEEDA', borderRadius: 10, padding: '2px 8px' }}>
          {hasPrior ? '↔ QoQ diff' : 'Single quarter'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '7px 14px', flexShrink: 0, borderBottom: '0.5px solid #e5e7eb', alignItems: 'center' }}>
        <select value={dirFilter} onChange={e => setDirFilter(e.target.value)}
          style={{ flex: 1, border: '0.5px solid #e5e7eb', borderRadius: 7, padding: '5px 8px', fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          {DIR_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ flex: 1, border: '0.5px solid #e5e7eb', borderRadius: 7, padding: '5px 8px', fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          {TYPE_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          style={{ flex: 1, border: '0.5px solid #e5e7eb', borderRadius: 7, padding: '5px 8px', fontSize: 12, background: '#fff', fontFamily: 'inherit' }} />
      </div>

      {allLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <Spinner size={28} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>Loading 2 quarters from SEC EDGAR...</span>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', minWidth: 130 }}>Ticker</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', minWidth: 50 }}>B/S</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', cursor: 'pointer', minWidth: 65 }} onClick={() => { setSortCol('value'); setSortDir(d => sortCol === 'value' ? d * -1 : -1) }}>Value{sortIcon('value')}</th>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#6b7280', borderBottom: '0.5px solid #e5e7eb', cursor: 'pointer', minWidth: 60 }} onClick={() => { setSortCol('conv'); setSortDir(d => sortCol === 'conv' ? d * -1 : -1) }}>Conv %{sortIcon('conv')}</th>
                <th style={{ padding: '7px 6px', width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const inWatch = watchlist.includes(row.nameOfIssuer)
                const typeColor = row.stype === 'ETF' ? '#633806' : row.stype === 'Option' ? '#1B6B2E' : row.stype === 'Fund' ? '#0C447C' : '#6b7280'
                const typeBg    = row.stype === 'ETF' ? '#FAEEDA' : row.stype === 'Option' ? '#EAF3DE' : row.stype === 'Fund' ? '#E6F1FB' : '#f3f4f6'
                return (
                  <tr key={row.nameOfIssuer + i} onClick={() => onSelectTicker(row)}
                    style={{ borderBottom: '0.5px solid #f3f4f6', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 16, textAlign: 'right' }}>{i + 1}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{row.nameOfIssuer.split(' ')[0].slice(0, 12)}</div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 1 }}>
                            <span style={{ fontSize: 9, color: '#9ca3af' }}>{row.funds.filter(f => f.change !== 'exit').length} fund{row.funds.filter(f => f.change !== 'exit').length !== 1 ? 's' : ''}</span>
                            <span style={{ fontSize: 9, background: typeBg, color: typeColor, borderRadius: 3, padding: '0 4px' }}>{row.stype}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {/* Buy/Sell conviction bar */}
                      {(() => {
                        const bull = row.newBuys + row.adds
                        const bear = row.trims + row.exits
                        const total = bull + bear + row.holds || 1
                        const bullPct = Math.round((bull / total) * 100)
                        const bearPct = Math.round((bear / total) * 100)
                        return (
                          <div>
                            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 3 }}>
                              <div style={{ width: `${bullPct}%`, background: '#2A8A50', borderRadius: '3px 0 0 3px' }} />
                              <div style={{ flex: 1, background: '#e5e7eb' }} />
                              <div style={{ width: `${bearPct}%`, background: '#C04040', borderRadius: '0 3px 3px 0' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {row.newBuys > 0 && <span style={{ fontSize: 8, background: '#D1FAE5', color: '#065F46', borderRadius: 3, padding: '0 4px' }}>🆕{row.newBuys}</span>}
                              {row.adds   > 0 && <span style={{ fontSize: 8, background: '#EAF3DE', color: '#27500A', borderRadius: 3, padding: '0 4px' }}>▲{row.adds}</span>}
                              {row.trims  > 0 && <span style={{ fontSize: 8, background: '#FEF9C3', color: '#854D0E', borderRadius: 3, padding: '0 4px' }}>▼{row.trims}</span>}
                              {row.exits  > 0 && <span style={{ fontSize: 8, background: '#FCEBEB', color: '#791F1F', borderRadius: 3, padding: '0 4px' }}>✕{row.exits}</span>}
                            </div>
                          </div>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>
                      {(() => {
                        // Net shares moved this quarter across all funds
                        const netShares = row.funds.reduce((s, f) => s + (f.shareDelta || 0), 0)
                        const impliedPrice = row.totalShares ? row.totalValue / row.totalShares : 0
                        const netVal = Math.abs(netShares) * impliedPrice
                        const isNet  = netShares !== 0
                        return (
                          <div>
                            {isNet && <div style={{ fontSize: 12, fontWeight: 500, color: netShares > 0 ? '#27500A' : '#791F1F' }}>
                              {netShares > 0 ? '+' : '−'}{fmtValue(netVal)}
                            </div>}
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{fmtValue(row.totalValue)} held</div>
                          </div>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ width: `${row.conv}%`, height: '100%', borderRadius: 2, background: row.conv >= 60 ? '#3B6D11' : row.conv <= 40 ? '#A32D2D' : '#f59e0b' }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#6b7280' }}>{row.conv}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <button onClick={e => { e.stopPropagation(); onToggleWatch(row.nameOfIssuer) }}
                        style={{ width: 24, height: 24, borderRadius: 5, border: inWatch ? '0.5px solid #97C459' : '0.5px solid #e5e7eb', background: inWatch ? '#EAF3DE' : '#fff', color: inWatch ? '#27500A' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                        {inWatch ? '★' : '☆'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
