export default function BottomNav({ active, onChange, watchlistCount }) {
  const tabs = [
    { id: 'grid',      icon: 'ti-layout-grid', label: 'Grid' },
    { id: 'heatmap',   icon: 'ti-flame',        label: 'Heatmap' },
    { id: 'watchlist', icon: 'ti-bookmark',     label: 'Watchlist' },
    { id: 'profile',   icon: 'ti-user',         label: 'Profile' },
  ]
  return (
    <nav style={{ height: 56, borderTop: '0.5px solid #e5e7eb', display: 'flex', background: '#fff', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 40 }}>
      {tabs.map(t => {
        const on = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: 'none', background: 'none', cursor: 'pointer', position: 'relative', padding: '6px 4px' }}
          >
            {t.id === 'watchlist' && watchlistCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 'calc(50% - 16px)', width: 14, height: 14, borderRadius: '50%', background: '#E24B4A', fontSize: 8, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {watchlistCount}
              </span>
            )}
            <i className={`ti ${t.icon}`} style={{ fontSize: 20, color: on ? '#185FA5' : '#9ca3af' }} />
            <span style={{ fontSize: 9, color: on ? '#185FA5' : '#9ca3af', fontWeight: on ? 500 : 400 }}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
