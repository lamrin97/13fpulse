import { useState, useEffect } from 'react'
import { getFundFilingsList, getHoldings, diffHoldings } from '../lib/api'

export const FUNDS = [
  // Original 4
  { id: 'tiger',       name: 'Tiger Global',        cik: '0001167483', color: '#f59e0b', aum: '$23B',  score: 71 },
  { id: 'bridgewater', name: 'Bridgewater',          cik: '0001350694', color: '#10b981', aum: '$124B', score: 87 },
  { id: 'aqr',         name: 'AQR Capital',          cik: '0001167557', color: '#8b5cf6', aum: '$93B',  score: 79 },
  { id: 'pershing',    name: 'Pershing Square',      cik: '0001336528', color: '#ef4444', aum: '$18B',  score: 82 },
  // New 10
  { id: 'citadel',     name: 'Citadel Advisors',     cik: '0001423053', color: '#0ea5e9', aum: '$63B',  score: 90 },
  { id: 'millennium',  name: 'Millennium Mgmt',      cik: '0001273087', color: '#6366f1', aum: '$83B',  score: 88 },
  { id: 'deshaw',      name: 'D.E. Shaw',             cik: '0001009672', color: '#14b8a6', aum: '$60B',  score: 85 },
  { id: 'point72',     name: 'Point72',               cik: '0001603466', color: '#f97316', aum: '$35B',  score: 83 },
  { id: 'renaissance', name: 'Renaissance Tech',      cik: '0001037389', color: '#a855f7', aum: '$55B',  score: 92 },
  { id: 'twosigma',    name: 'Two Sigma',             cik: '0001179392', color: '#ec4899', aum: '$60B',  score: 86 },
  { id: 'appaloosa',   name: 'Appaloosa Mgmt',        cik: '0001006438', color: '#84cc16', aum: '$14B',  score: 78 },
  { id: 'baupost',     name: 'Baupost Group',         cik: '0001061768', color: '#06b6d4', aum: '$27B',  score: 81 },
  { id: 'thirdpoint',  name: 'Third Point',           cik: '0001040273', color: '#f43f5e', aum: '$10B',  score: 76 },
  { id: 'duquesne',    name: 'Duquesne Family Office',cik: '0001536411', color: '#fb923c', aum: '$3B',   score: 89 },
]

const CACHE = {}
const CACHE_TTL = 1000 * 60 * 30

async function loadFund(fund) {
  const key = fund.id
  const cached = CACHE[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  const filings = await getFundFilingsList(fund.cik, 2)
  const current = filings[0]
  const prior   = filings[1] || null

  const [currentHoldings, priorHoldings] = await Promise.all([
    getHoldings(fund.cik, current.accession),
    prior ? getHoldings(fund.cik, prior.accession).catch(() => []) : Promise.resolve([]),
  ])

  const { enriched, exits } = diffHoldings(currentHoldings, priorHoldings)

  const data = {
    accession:    current.accession,
    filed:        current.filed,
    period:       current.period || current.filed?.slice(0, 7),
    priorFiled:   prior?.filed || null,
    priorPeriod:  prior?.period || prior?.filed?.slice(0, 7) || null,
    holdings:     enriched,
    exits,
    hasPrior:     priorHoldings.length > 0,
  }
  CACHE[key] = { ts: Date.now(), data }
  return data
}

export function useFunds() {
  const [fundData, setFundData] = useState(
    () => Object.fromEntries(FUNDS.map(f => [f.id, { loading: true, error: null, holdings: [], exits: [], hasPrior: false }]))
  )

  useEffect(() => {
    FUNDS.forEach(fund => {
      loadFund(fund)
        .then(data => setFundData(prev => ({ ...prev, [fund.id]: { loading: false, error: null, ...data } })))
        .catch(err  => setFundData(prev => ({ ...prev, [fund.id]: { loading: false, error: err.message, holdings: [], exits: [], hasPrior: false } })))
    })
  }, [])

  const allHoldings = FUNDS.flatMap(f => {
    const fd = fundData[f.id]
    if (!fd || fd.loading || fd.error) return []
    return (fd.holdings || []).map(h => ({
      ...h,
      fundId: f.id, fundName: f.name, fundColor: f.color,
      filed: fd.filed, period: fd.period,
      priorFiled: fd.priorFiled, priorPeriod: fd.priorPeriod,
    }))
  })

  const allExits = FUNDS.flatMap(f => {
    const fd = fundData[f.id]
    if (!fd || fd.loading || fd.error) return []
    return (fd.exits || []).map(h => ({
      ...h,
      fundId: f.id, fundName: f.name, fundColor: f.color,
      filed: fd.filed, period: fd.period,
      priorFiled: fd.priorFiled, priorPeriod: fd.priorPeriod,
    }))
  })

  const byTicker = {}

  allHoldings.forEach(h => {
    const tk = h.nameOfIssuer
    if (!byTicker[tk]) byTicker[tk] = { nameOfIssuer: tk, cusip: h.cusip, totalValue: 0, totalShares: 0, fundMap: {} }
    byTicker[tk].totalValue  += h.value
    byTicker[tk].totalShares += h.shares

    const fm = byTicker[tk].fundMap
    if (!fm[h.fundId]) {
      fm[h.fundId] = {
        fundId: h.fundId, fundName: h.fundName, fundColor: h.fundColor,
        filed: h.filed, period: h.period,
        priorFiled: h.priorFiled, priorPeriod: h.priorPeriod,
        currentValue: 0, currentShares: 0,
        priorValue: 0,   priorShares: 0,
        change: h.change,
      }
    }
    fm[h.fundId].currentValue  += h.value
    fm[h.fundId].currentShares += h.shares
    fm[h.fundId].priorShares   += (h.priorShares || 0)
    fm[h.fundId].priorValue    += (h.priorValue  || 0)
    const priority = { exit: 5, trim: 4, add: 3, new: 2, hold: 1 }
    if ((priority[h.change] || 0) > (priority[fm[h.fundId].change] || 0)) {
      fm[h.fundId].change = h.change
    }
  })

  allExits.forEach(h => {
    const tk = h.nameOfIssuer
    if (!byTicker[tk]) byTicker[tk] = { nameOfIssuer: tk, cusip: h.cusip, totalValue: 0, totalShares: 0, fundMap: {} }
    const fm = byTicker[tk].fundMap
    if (!fm[h.fundId]) {
      fm[h.fundId] = {
        fundId: h.fundId, fundName: h.fundName, fundColor: h.fundColor,
        filed: h.filed, period: h.period,
        priorFiled: h.priorFiled, priorPeriod: h.priorPeriod,
        currentValue: 0, currentShares: 0,
        priorValue: h.priorValue || 0, priorShares: h.priorShares || 0,
        change: 'exit',
      }
    } else {
      fm[h.fundId].priorShares += (h.priorShares || 0)
      fm[h.fundId].priorValue  += (h.priorValue  || 0)
      fm[h.fundId].change = 'exit'
    }
  })

  const tickers = Object.values(byTicker).map(t => {
    const funds = Object.values(t.fundMap).map(f => ({
      ...f,
      shareDelta: f.currentShares - f.priorShares,
      valueDelta: f.currentValue  - f.priorValue,
    }))
    return { ...t, funds }
  }).sort((a, b) => b.totalValue - a.totalValue)

  return { fundData, tickers, allHoldings, allExits }
}
