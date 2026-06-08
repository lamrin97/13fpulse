import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getNextDeadline } from '../lib/api'

const ALERT_DEFS = [
  { id: 'filing',   label: 'New filing drops',    sub: 'When tracked funds submit a 13F' },
  { id: 'deadline', label: 'Deadline reminder',    sub: '2 days before filing deadline' },
  { id: 'signals',  label: 'Early signals',        sub: 'Pre-filing activity on watchlist tickers' },
  { id: 'digest',   label: 'Weekly digest email',  sub: 'Sunday summary to your inbox' },
]

function Toggle({ on, onToggle, disabled }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={disabled ? null : onToggle}
        title={disabled ? 'Sign in to enable alerts' : ''}
        style={{ width: 34, height: 18, borderRadius: 9, border: 'none', background: on ? '#185FA5' : '#d1d5db', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

export default function WatchlistTab({ watchlist, tickers, onRemove, onSelectTicker }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState({ filing: true, deadline: true, signals: false, digest: true })
  const deadline = getNextDeadline()

  const toggleAlert = id => {
    if (!user) return
    setAlerts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const watchedTickers = tickers.filter(t => watchlist.includes(t.nameOfIssuer))

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {!user && (
        <div style={{ padding: '8px 14px', background: '#EAF3DE', borderBottom: '0.5px solid #C0DD97', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#27500A', flex: 1 }}>Sign in to save your watchlist across devices.</span>
        </div>
      )}

      <div style={{ padding: '8px 14px 5px', fontSize: 10, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
        Tracking {watchlist.length} ticker{watchlist.length !== 1 ? 's' : ''}
      </div>

      {watchedTickers.length === 0 ? (
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>☆</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>No tickers tracked yet</div>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>Tap ☆ on any ticker in the Grid to start tracking.</div>
        </div>
      ) : (
        watchedTickers.map(t => {
          const newBuys = t.funds.filter(f => f.change === 'new').length
          const adds    = t.funds.filter(f => f.change === 'add').length
          const trims   = t.funds.filter(f => f.change === 'trim').length
          const exits   = t.funds.filter(f => f.change === 'exit').length
          return (
            <div key={t.nameOfIssuer} onClick={() => onSelectTicker(t)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{t.nameOfIssuer.split(' ')[0].slice(0, 12)}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nameOfIssuer}</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {newBuys > 0 && <span style={{ fontSize: 9, background: '#D1FAE5', color: '#065F46', borderRadius: 4, padding: '1px 5px' }}>🆕{newBuys}</span>}
                {adds   > 0 && <span style={{ fontSize: 9, background: '#EAF3DE', color: '#27500A', borderRadius: 4, padding: '1px 5px' }}>▲{adds}</span>}
                {trims  > 0 && <span style={{ fontSize: 9, background: '#FEF9C3', color: '#854D0E', borderRadius: 4, padding: '1px 5px' }}>▼{trims}</span>}
                {exits  > 0 && <span style={{ fontSize: 9, background: '#FCEBEB', color: '#791F1F', borderRadius: 4, padding: '1px 5px' }}>✕{exits}</span>}
              </div>
              <button onClick={e => { e.stopPropagation(); onRemove(t.nameOfIssuer) }}
                style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9ca3af', cursor: 'pointer', flexShrink: 0 }}>
                ×
              </button>
            </div>
          )
        })
      )}

      <div style={{ padding: '8px 14px 5px', fontSize: 10, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb', borderTop: '0.5px solid #e5e7eb' }}>
        Alerts {!user && <span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'none', letterSpacing: 0 }}>— sign in to enable</span>}
      </div>

      {ALERT_DEFS.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '0.5px solid #f3f4f6', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{a.label}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{a.sub}</div>
          </div>
          <Toggle on={user ? alerts[a.id] : false} onToggle={() => toggleAlert(a.id)} disabled={!user} />
        </div>
      ))}

      <div style={{ padding: '8px 14px 5px', fontSize: 10, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb', borderTop: '0.5px solid #e5e7eb' }}>
        Next filing deadline
      </div>
      <div style={{ margin: '10px 14px', background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb', padding: '11px 13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{deadline.label} deadline</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{deadline.date}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#185FA5' }}>{deadline.days} days</span>
        </div>
        <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2 }}>
          <div style={{ width: `${deadline.pct}%`, height: '100%', background: '#185FA5', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  )
}
