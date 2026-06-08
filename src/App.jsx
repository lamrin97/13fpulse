import { useState } from 'react'
import { useFunds } from './hooks/useFunds'
import { useWatchlist } from './hooks/useWatchlist'
import BottomNav from './components/BottomNav'
import GridTab from './components/GridTab'
import HeatmapTab from './components/HeatmapTab'
import WatchlistTab from './components/WatchlistTab'
import ProfileTab from './components/ProfileTab'
import TickerDetail from './components/TickerDetail'

export default function App() {
  const [tab, setTab]           = useState('grid')
  const [selected, setSelected] = useState(null)
  const { fundData, tickers }   = useFunds()
  const { watchlist, toggle, remove } = useWatchlist()

  function handleSelectTicker(ticker) {
    setSelected(ticker)
  }

  function handleBack() {
    setSelected(null)
  }

  const FILING_PERIOD = 'Q1 2026 · May 15 2026 deadline'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 480, margin: '0 auto', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      {!selected && (
        <header style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0, background: '#fff', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#0C447C', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              13F
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', letterSpacing: '0.04em' }}>13F Pulse</div>
              <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: '0.04em' }}>{FILING_PERIOD}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 10, color: '#10b981', fontWeight: 500 }}>SEC EDGAR</span>
          </div>
        </header>
      )}

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selected ? (
          <TickerDetail
            ticker={selected}
            onBack={handleBack}
            watchlist={watchlist}
            onToggleWatch={toggle}
          />
        ) : (
          <>
            {tab === 'grid'      && <GridTab      tickers={tickers} fundData={fundData} watchlist={watchlist} onToggleWatch={toggle} onSelectTicker={handleSelectTicker} />}
            {tab === 'heatmap'   && <HeatmapTab   tickers={tickers} fundData={fundData} onSelectTicker={handleSelectTicker} />}
            {tab === 'watchlist' && <WatchlistTab  watchlist={watchlist} tickers={tickers} onRemove={remove} onSelectTicker={handleSelectTicker} />}
            {tab === 'profile'   && <ProfileTab />}
          </>
        )}
      </div>

      {!selected && (
        <BottomNav active={tab} onChange={setTab} watchlistCount={watchlist.length} />
      )}
    </div>
  )
}
