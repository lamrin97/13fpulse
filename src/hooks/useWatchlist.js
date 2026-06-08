import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const LS_KEY = '13fpulse_watchlist'

function lsGet() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function lsSet(tickers) {
  localStorage.setItem(LS_KEY, JSON.stringify(tickers))
}

export function useWatchlist() {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState([])

  const load = useCallback(async () => {
    if (user && supabase) {
      const { data } = await supabase
        .from('watchlist')
        .select('ticker')
        .eq('user_id', user.id)
      setWatchlist((data || []).map(r => r.ticker))
    } else {
      setWatchlist(lsGet())
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (ticker) => {
    if (watchlist.includes(ticker)) return
    const next = [...watchlist, ticker]
    setWatchlist(next)
    if (user && supabase) {
      await supabase.from('watchlist').insert({ user_id: user.id, ticker })
    } else {
      lsSet(next)
    }
  }, [watchlist, user])

  const remove = useCallback(async (ticker) => {
    const next = watchlist.filter(t => t !== ticker)
    setWatchlist(next)
    if (user && supabase) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq('ticker', ticker)
    } else {
      lsSet(next)
    }
  }, [watchlist, user])

  const toggle = useCallback((ticker) => {
    watchlist.includes(ticker) ? remove(ticker) : add(ticker)
  }, [watchlist, add, remove])

  return { watchlist, add, remove, toggle }
}
