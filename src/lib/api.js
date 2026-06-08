const SEC   = import.meta.env.VITE_SEC_PROXY  || 'https://nirmaljain--e8bf15ac5f0211f18e6b1607ee4eb77e.web.val.run'
const FMP   = import.meta.env.VITE_FMP_API_KEY || ''
const EDGAR = 'https://data.sec.gov'

// SEC XML value field is in dollars
export function fmtValue(dollars) {
  if (!dollars) return '—'
  if (dollars >= 1e9) return `$${(dollars / 1e9).toFixed(1)}B`
  if (dollars >= 1e6) return `$${(dollars / 1e6).toFixed(0)}M`
  return `$${(dollars / 1e3).toFixed(0)}K`
}

// Detect security type from issuer name
export function secType(name) {
  const n = (name || '').toUpperCase()
  if (/ISHARES|SPDR|VANGUARD ETF|INVESCO|PROSHARES|DIREXION|WISDOMTREE/.test(n)) return 'ETF'
  if (/PUT|CALL/.test(n)) return 'Option'
  if (/FUND|TRUST|LP |L\.P\.|LLC/.test(n)) return 'Fund'
  return 'Stock'
}

// Compute next 13F deadline dynamically (45 days after quarter end)
export function getNextDeadline() {
  const now    = new Date()
  const year   = now.getFullYear()
  // Quarter end dates + 45 days = deadlines
  const deadlines = [
    { label: 'Q1', date: new Date(year, 4, 15) },     // May 15
    { label: 'Q2', date: new Date(year, 7, 14) },     // Aug 14
    { label: 'Q3', date: new Date(year, 10, 14) },    // Nov 14
    { label: 'Q4', date: new Date(year + 1, 1, 14) }, // Feb 14 next year
  ]
  const next = deadlines.find(d => d.date > now) || deadlines[0]
  const days = Math.ceil((next.date - now) / (1000 * 60 * 60 * 24))
  const quarterStart = new Date(next.date.getFullYear(), next.date.getMonth() - 3, next.date.getDate())
  const totalDays    = Math.ceil((next.date - quarterStart) / (1000 * 60 * 60 * 24))
  const elapsed      = totalDays - days
  const pct          = Math.round((elapsed / totalDays) * 100)
  return {
    label: `${next.label} ${next.date.getFullYear()}`,
    date:  next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    days,
    pct: Math.max(0, Math.min(100, pct)),
  }
}

// Symbol cache — maps CUSIP or company name to FMP ticker symbol
const symbolCache = {}

// Common name → symbol mappings for top holdings
const SYMBOL_MAP = {
  'NVIDIA': 'NVDA', 'NVIDIA CORPORATION': 'NVDA',
  'ALPHABET': 'GOOGL', 'ALPHABET INC': 'GOOGL',
  'AMAZON': 'AMZN', 'AMAZON COM INC': 'AMZN',
  'META': 'META', 'META PLATFORMS INC': 'META',
  'MICROSOFT': 'MSFT', 'MICROSOFT CORP': 'MSFT',
  'APPLE': 'AAPL', 'APPLE INC': 'AAPL',
  'TAIWAN SEMICONDUCTOR': 'TSM', 'TAIWAN SEMICONDUCTOR MANUFAC': 'TSM',
  'BROADCOM': 'AVGO', 'BROADCOM INC': 'AVGO',
  'NETFLIX': 'NFLX', 'NETFLIX INC': 'NFLX', 'NETFLIX INC.': 'NFLX',
  'SPOTIFY': 'SPOT', 'SPOTIFY TECHNOLOGY S A': 'SPOT',
  'UBER': 'UBER', 'UBER TECHNOLOGIES INC': 'UBER',
  'COUPANG': 'CPNG', 'COUPANG INC': 'CPNG',
  'SEA': 'SE', 'SEA LTD': 'SE',
  'NU': 'NU', 'NU HLDGS LTD': 'NU',
  'MERCADOLIBRE': 'MELI', 'MERCADOLIBRE INC': 'MELI',
  'ZILLOW': 'Z', 'ZILLOW GROUP INC': 'Z',
  'REDDIT': 'RDDT', 'REDDIT INC': 'RDDT',
  'SERVICENOW': 'NOW', 'SERVICENOW INC': 'NOW',
  'DOORDASH': 'DASH', 'DOORDASH INC': 'DASH',
  'GE VERNOVA': 'GEV', 'GE VERNOVA INC': 'GEV',
  'INTEL': 'INTC', 'INTEL CORP': 'INTC',
  'LAM RESEARCH': 'LRCX', 'LAM RESEARCH CORP': 'LRCX',
  'APPLIED MATLS': 'AMAT', 'APPLIED MATLS INC': 'AMAT',
  'CORPAY': 'CPAY', 'CORPAY INC': 'CPAY',
  'COSTAR': 'CSGP', 'COSTAR GROUP INC': 'CSGP',
  'PROCORE': 'PCOR', 'PROCORE TECHNOLOGIES INC': 'PCOR',
  'ZSCALER': 'ZS', 'ZSCALER INC': 'ZS',
  'APPLOVIN': 'APP', 'APPLOVIN CORP': 'APP',
  'TAKE-TWO': 'TTWO', 'TAKE-TWO INTERACTIVE SOFTWAR': 'TTWO',
  'BLOCK': 'SQ', 'BLOCK INC': 'SQ',
  'APOLLO': 'APO', 'APOLLO GLOBAL MGMT INC': 'APO',
  'UNITEDHEALTH': 'UNH', 'UNITEDHEALTH GROUP INC': 'UNH',
  'SHERWIN WILLIAMS': 'SHW', 'SHERWIN WILLIAMS CO': 'SHW',
  'JD': 'JD', 'JD.COM INC': 'JD',
  'LIBERTY MEDIA': 'LLYVK', 'LIBERTY MEDIA CORP DEL': 'LLYVK',
  'LUMENTUM': 'LITE', 'LUMENTUM HLDGS INC': 'LITE',
}

// Resolve ticker symbol — tries symbol map first, then CUSIP, then name search
export async function resolveSymbol(companyName, cusip = '') {
  const nameKey = companyName.toUpperCase().trim()
  const cacheKey = cusip || nameKey
  if (symbolCache[cacheKey]) return symbolCache[cacheKey]

  // Check hardcoded map first — instant and reliable
  if (SYMBOL_MAP[nameKey]) {
    symbolCache[cacheKey] = SYMBOL_MAP[nameKey]
    return SYMBOL_MAP[nameKey]
  }
  // Try first word match
  const firstWord = nameKey.split(' ')[0]
  if (SYMBOL_MAP[firstWord]) {
    symbolCache[cacheKey] = SYMBOL_MAP[firstWord]
    return SYMBOL_MAP[firstWord]
  }

  if (FMP) {
    // Try CUSIP lookup
    if (cusip) {
      try {
        const res  = await fetch(`https://financialmodelingprep.com/api/v3/cusip/${cusip}?apikey=${FMP}`)
        const data = await res.json()
        if (data?.[0]?.symbol) {
          symbolCache[cacheKey] = data[0].symbol
          return data[0].symbol
        }
      } catch {}
    }
    // Try name search
    try {
      const res  = await fetch(`https://financialmodelingprep.com/stable/search?query=${encodeURIComponent(companyName)}&limit=1&exchange=NASDAQ,NYSE&apikey=${FMP}`)
      const data = await res.json()
      if (data?.[0]?.symbol) {
        symbolCache[cacheKey] = data[0].symbol
        return data[0].symbol
      }
    } catch {}
  }

  // Last resort
  const sym = firstWord.slice(0, 5)
  symbolCache[cacheKey] = sym
  return sym
}

// Net transaction value = shareDelta × implied price (value/shares)
// Shows dollars added or removed, not total position size
export function fmtNetValue(shareDelta, currentValue, currentShares) {
  if (!shareDelta || !currentShares) return '—'
  const impliedPrice = currentValue / currentShares
  const netDollars   = Math.abs(shareDelta) * impliedPrice
  const sign = shareDelta > 0 ? '+' : '−'
  return `${sign}${fmtValue(netDollars)}`
}

async function secFetch(path) {
  const base = path.startsWith('/Archives') ? 'https://www.sec.gov' : EDGAR
  const res = await fetch(`${SEC}?url=${encodeURIComponent(base + path)}`)
  if (!res.ok) throw new Error(`SEC ${res.status}: ${path}`)
  return res
}

// Returns array of last N 13F-HR filings for a CIK — fully dynamic, no hardcoding
export async function getFundFilingsList(cik, count = 2) {
  const res  = await secFetch(`/submissions/CIK${cik}.json`)
  const data = await res.json()
  const f    = data.filings?.recent
  if (!f) throw new Error('No filings found')
  const results = []
  for (let i = 0; i < f.form.length && results.length < count; i++) {
    if (f.form[i] === '13F-HR') {
      results.push({
        accession: f.accessionNumber[i],
        filed:     f.filingDate[i],
        period:    (f.reportDate || [])[i] || '',
      })
    }
  }
  if (!results.length) throw new Error('No 13F-HR filings found')
  return results
}

export async function getFundFilings(cik) {
  const list = await getFundFilingsList(cik, 1)
  return list[0]
}

export async function getHoldings(cik, accessionRaw) {
  const acc  = accessionRaw.replace(/-/g, '')
  const cikN = parseInt(cik).toString()
  const base = `/Archives/edgar/data/${cikN}/${acc}`

  const xmlCandidates = ['infotable.xml', 'form13fInfoTable.xml', 'informationtable.xml', 'holdings.xml']
  let xmlText = null
  for (const filename of xmlCandidates) {
    try {
      const res = await secFetch(`${base}/${filename}`)
      xmlText = await res.text()
      if (xmlText && xmlText.includes('infoTable')) break
      xmlText = null
    } catch { continue }
  }
  if (!xmlText) throw new Error('Holdings XML not found')

  const parser = new DOMParser()
  const doc    = parser.parseFromString(xmlText, 'text/xml')
  const rows   = []
  doc.querySelectorAll('infoTable').forEach(row => {
    const g = tag => row.querySelector(tag)?.textContent?.trim() || ''
    rows.push({
      nameOfIssuer: g('nameOfIssuer'),
      cusip:        g('cusip'),
      value:        parseInt(g('value')) || 0,
      shares:       parseInt(g('sshPrnamt')) || 0,
      putCall:      g('putCall'),
    })
  })
  return rows.sort((a, b) => b.value - a.value)
}

// Diff two holdings arrays using NAME-based matching (not CUSIP)
// This handles funds like AQR that file multiple CUSIPs per company
export function diffHoldings(current, prior) {
  // Group prior by normalized company name
  const priorByName = {}
  ;(prior || []).forEach(h => {
    const key = h.nameOfIssuer.toUpperCase().trim()
    if (!priorByName[key]) priorByName[key] = { shares: 0, value: 0 }
    priorByName[key].shares += h.shares
    priorByName[key].value  += h.value
  })

  // Group current by normalized company name
  const currentByName = {}
  ;(current || []).forEach(h => {
    const key = h.nameOfIssuer.toUpperCase().trim()
    if (!currentByName[key]) currentByName[key] = { shares: 0, value: 0, cusip: h.cusip, nameOfIssuer: h.nameOfIssuer }
    currentByName[key].shares += h.shares
    currentByName[key].value  += h.value
  })

  // Build enriched current holdings
  const enriched = Object.values(currentByName).map(h => {
    const p = priorByName[h.nameOfIssuer.toUpperCase().trim()]
    if (!p) return { ...h, change: 'new', priorShares: 0, priorValue: 0, shareDelta: h.shares }
    const delta = h.shares - p.shares
    const pct   = p.shares ? Math.round((delta / p.shares) * 100) : 0
    const change = Math.abs(pct) < 2 ? 'hold' : delta > 0 ? 'add' : 'trim'
    return { ...h, change, priorShares: p.shares, priorValue: p.value, shareDelta: delta }
  })

  // Find exits — in prior but not in current
  const exits = Object.entries(priorByName)
    .filter(([key]) => !currentByName[key])
    .map(([key, p]) => {
      const name = (prior || []).find(h => h.nameOfIssuer.toUpperCase().trim() === key)?.nameOfIssuer || key
      return { nameOfIssuer: name, cusip: '', value: 0, shares: 0, change: 'exit', priorShares: p.shares, priorValue: p.value, shareDelta: -p.shares }
    })

  return { enriched, exits }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Yahoo Finance via proxy — completely free, no API key
const YF = (path) => `${SEC}?url=${encodeURIComponent('https://query1.finance.yahoo.com' + path)}`

async function getCachedFundamentals(symbol) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  try {
    const res  = await fetch(`${SUPABASE_URL}/rest/v1/fundamentals_cache?symbol=eq.${symbol}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
    const data = await res.json()
    if (!data?.[0]) return null
    const row     = data[0]
    const sameDay = new Date(row.cached_at).toDateString() === new Date().toDateString()
    if (!sameDay) return null
    return { trPE: row.tr_pe, fwPE: row.fw_pe, peg: row.peg, mcap: row.mcap, ptTarget: row.pt_target, ptHigh: row.pt_high, ptLow: row.pt_low, analysts: row.analysts, sector: row.sector, name: row.company_name }
  } catch { return null }
}

async function saveFundamentalsCache(symbol, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/fundamentals_cache`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ symbol, tr_pe: data.trPE, fw_pe: data.fwPE, peg: data.peg, mcap: data.mcap, pt_target: data.ptTarget, pt_high: data.ptHigh, pt_low: data.ptLow, analysts: data.analysts, sector: data.sector, company_name: data.name, cached_at: new Date().toISOString() })
    })
  } catch {}
}

export async function getFundamentals(ticker) {
  try {
    // Always get live price from Yahoo Finance chart endpoint
    const chartRes  = await fetch(YF(`/v8/finance/chart/${ticker}?interval=1d&range=1d`))
    const chartData = await chartRes.json()
    const meta      = chartData?.chart?.result?.[0]?.meta || {}
    const price     = meta.regularMarketPrice || null
    const prevClose = meta.chartPreviousClose || meta.previousClose || null
    const priceChg  = price && prevClose ? +(price - prevClose).toFixed(2) : null

    // Check Supabase cache for ratios
    const cached = await getCachedFundamentals(ticker)
    if (cached) return { price, priceChg, ...cached }

    // Fetch ratios from Yahoo quoteSummary
    const qsRes  = await fetch(YF(`/v10/finance/quoteSummary/${ticker}?modules=summaryDetail,defaultKeyStatistics,financialData,price`))
    const qsData = await qsRes.json()
    const qs     = qsData?.quoteSummary?.result?.[0] || {}
    const sd     = qs.summaryDetail       || {}
    const ks     = qs.defaultKeyStatistics || {}
    const fd     = qs.financialData        || {}
    const pr     = qs.price                || {}

    const ratioData = {
      trPE:     sd.trailingPE?.raw      || null,
      fwPE:     sd.forwardPE?.raw       || null,
      peg:      ks.pegRatio?.raw        || null,
      mcap:     pr.marketCap?.raw       || null,
      ptTarget: fd.targetMeanPrice?.raw  || null,
      ptHigh:   fd.targetHighPrice?.raw  || null,
      ptLow:    fd.targetLowPrice?.raw   || null,
      analysts: fd.numberOfAnalystOpinions?.raw || null,
      sector:   pr.sector               || null,
      name:     pr.longName || pr.shortName || null,
    }

    saveFundamentalsCache(ticker, ratioData)
    return { price, priceChg, ...ratioData }
  } catch { return null }
}

export async function getTickerNews(ticker) {
  try {
    const rssUrl = `https://finance.yahoo.com/rss/headline?s=${ticker}`
    const res    = await fetch(`${SEC}?url=${encodeURIComponent(rssUrl)}`)
    const text   = await res.text()

    // Extract all <link> URLs from raw text — more reliable than XML parser for RSS
    const linkMatches = [...text.matchAll(/<link>(https?[^<]+)<\/link>/g)].map(m => m[1].trim())

    const parser = new DOMParser()
    const xml    = parser.parseFromString(text, 'text/xml')
    const items  = Array.from(xml.querySelectorAll('item')).slice(0, 8)

    return items.map((item, i) => ({
      source:    'Yahoo Finance',
      time:      item.querySelector('pubDate')?.textContent || '',
      headline:  item.querySelector('title')?.textContent || '',
      snippet:   item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 160) || '',
      url:       linkMatches[i] || item.querySelector('guid')?.textContent || '',
      sentiment: 'neutral',
    })).filter(n => n.headline)
  } catch { return [] }
}

export async function getHistoricalPrice(ticker, fromDate) {
  try {
    const from   = new Date(fromDate)
    const now    = new Date()
    const days   = Math.ceil((now - from) / (1000 * 60 * 60 * 24)) + 5
    const range  = days > 365 ? '2y' : days > 180 ? '1y' : days > 90 ? '6mo' : '3mo'
    const res    = await fetch(YF(`/v8/finance/chart/${ticker}?interval=1d&range=${range}`))
    const data   = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const timestamps = result.timestamp || []
    const closes     = result.indicators?.quote?.[0]?.close || []
    const fromTs     = from.getTime() / 1000
    return closes.filter((c, i) => timestamps[i] >= fromTs && c != null)
  } catch { return [] }
}
