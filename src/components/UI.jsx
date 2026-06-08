export function Spinner({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#378ADD', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    />
  )
}

export function ConvictionPill({ buys, sells }) {
  const total = buys + sells
  if (!total) return <div style={{ width: 44, height: 11, borderRadius: 6, background: '#e5e7eb', border: '0.5px solid #d1d5db' }} />
  const bp = Math.round((buys / total) * 100)
  return (
    <div style={{ width: 44, height: 11, borderRadius: 6, overflow: 'hidden', display: 'flex', border: '0.5px solid #d1d5db', flexShrink: 0 }}>
      <div style={{ width: `${bp}%`, height: '100%', background: '#3B6D11' }} />
      <div style={{ width: `${100 - bp}%`, height: '100%', background: '#A32D2D' }} />
    </div>
  )
}

export function NetPill({ net }) {
  const cls = net === 'buy' ? 'buy-pill' : net === 'sell' ? 'sell-pill' : 'mix-pill'
  const icon = net === 'buy' ? '▲' : net === 'sell' ? '▼' : '◆'
  const label = net === 'buy' ? 'Net buy' : net === 'sell' ? 'Net sell' : 'Split'
  return (
    <span className={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {icon} {label}
    </span>
  )
}

export function MiniSpark({ values = [], perf = 0 }) {
  if (!values.length) return null
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1
  const col = perf >= 0 ? '#639922' : '#E24B4A'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 12 }}>
      {values.map((v, i) => {
        const h = Math.max(2, Math.round(((v - min) / range) * 10) + 2)
        const op = (0.35 + 0.65 * ((v - min) / range)).toFixed(2)
        return <div key={i} style={{ width: 3, height: h, background: col, opacity: op, borderRadius: '1px 1px 0 0' }} />
      })}
    </div>
  )
}

export function InfoTooltip({ text }) {
  const [show, setShow] = React.useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        onClick={() => setShow(s => !s)}
        style={{ width: 14, height: 14, borderRadius: '50%', border: '0.5px solid #d1d5db', background: '#f9fafb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#6b7280', cursor: 'pointer', flexShrink: 0 }}
      >i</span>
      {show && (
        <div style={{ position: 'absolute', bottom: 18, left: 0, width: 220, background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#374151', lineHeight: 1.5, zIndex: 99, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          {text}
          <div onClick={() => setShow(false)} style={{ marginTop: 4, color: '#9ca3af', cursor: 'pointer', fontSize: 10 }}>close</div>
        </div>
      )}
    </span>
  )
}

import React from 'react'
