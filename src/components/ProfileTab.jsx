import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getNextDeadline } from '../lib/api'

const FREE_FEATURES = [
  'Full ticker grid — all Q1 2026 filings',
  'Heatmap — all three views',
  'Ticker drill-down with fund breakdown',
  'QoQ diff — real buys, adds, trims, exits',
  'Fundamentals: PE, PEG, analyst targets',
  'News tab per ticker',
]
const SIGNIN_FEATURES = [
  'Watchlist saved across devices',
  'Filing deadline browser alerts',
  'Weekly digest email',
  'Early signal alerts for watchlist',
]

function AuthForm({ mode, onDone }) {
  const { signIn, signUp } = useAuth()
  const [first, setFirst]     = useState('')
  const [last, setLast]       = useState('')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const { error } = mode === 'signin'
        ? await signIn(email, pass)
        : await signUp(email, pass, first, last)
      if (error) setErr(error.message)
      else onDone()
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  const inp = { border: '0.5px solid #e5e7eb', borderRadius: 7, padding: '9px 12px', fontSize: 13, width: '100%', background: '#fff', color: '#111827', fontFamily: 'inherit' }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0' }}>
      {mode === 'signup' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={first} onChange={e => setFirst(e.target.value)} placeholder="First name" required style={{ ...inp, flex: 1 }} />
          <input value={last}  onChange={e => setLast(e.target.value)}  placeholder="Last name"  required style={{ ...inp, flex: 1 }} />
        </div>
      )}
      <input type="email"    value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required style={inp} />
      <input type="password" value={pass}  onChange={e => setPass(e.target.value)}  placeholder="Password"      required style={inp} />
      {err && <div style={{ fontSize: 11, color: '#A32D2D' }}>{err}</div>}
      <button type="submit" disabled={loading} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#0C447C', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
        {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  )
}

export default function ProfileTab() {
  const { user, signOut } = useAuth()
  const [authMode, setAuthMode] = useState(null)
  const deadline = getNextDeadline()

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'
  const lastName  = user?.user_metadata?.last_name  || ''
  const initials  = `${firstName[0] || 'U'}${lastName[0] || ''}`.toUpperCase()

  if (authMode) return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '0.5px solid #e5e7eb', marginBottom: 4 }}>
        <button onClick={() => setAuthMode(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{authMode === 'signin' ? 'Sign in' : 'Create account'}</span>
      </div>
      <AuthForm mode={authMode} onDone={() => setAuthMode(null)} />
      <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 8 }}>
        {authMode === 'signin'
          ? <span>No account? <span onClick={() => setAuthMode('signup')} style={{ color: '#185FA5', cursor: 'pointer' }}>Create one free</span></span>
          : <span>Already have one? <span onClick={() => setAuthMode('signin')} style={{ color: '#185FA5', cursor: 'pointer' }}>Sign in</span></span>}
      </div>
    </div>
  )

  const DeadlineCard = () => (
    <div style={{ margin: '10px 16px', background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb', padding: '11px 13px' }}>
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
  )

  if (user) return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: '0.5px solid #e5e7eb' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E6F1FB', border: '1.5px solid #85B7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 500, color: '#0C447C', flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>{firstName} {lastName}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user.email}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, background: '#EAF3DE', color: '#27500A', fontSize: 10, fontWeight: 500, borderRadius: 10, padding: '2px 8px' }}>✓ Free plan</span>
        </div>
      </div>
      <DeadlineCard />
      <button onClick={signOut} style={{ margin: '0 16px 16px', width: 'calc(100% - 32px)', padding: 10, borderRadius: 8, border: '0.5px solid #fca5a5', background: '#fff', color: '#A32D2D', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        Sign out
      </button>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <DeadlineCard />
      <div style={{ margin: '0 16px 16px', background: '#f9fafb', borderRadius: 10, border: '0.5px solid #e5e7eb', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Browsing as guest</div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>All core features are free. Sign in to save your watchlist and get deadline alerts.</div>
        <button onClick={() => setAuthMode('signin')} style={{ width: '100%', padding: 9, borderRadius: 7, border: 'none', background: '#0C447C', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 7 }}>Sign in</button>
        <button onClick={() => setAuthMode('signup')} style={{ width: '100%', padding: 9, borderRadius: 7, border: '0.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Create free account</button>
      </div>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Free — no account needed</div>
        {FREE_FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#3B6D11' }}>✓</span>
            <span style={{ fontSize: 12, color: '#374151' }}>{f}</span>
          </div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 6px' }}>Sign in to unlock</div>
        {SIGNIN_FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
            <span style={{ fontSize: 13, color: '#d1d5db' }}>🔒</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
