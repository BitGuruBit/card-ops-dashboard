'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency } from '@/lib/utils'

const PLATFORM_FEES: Record<string, number> = {
  eBay:      0.1325,
  TCGPlayer: 0.1099,
  Facebook:  0.05,
  Local:     0,
  Other:     0.10,
}

const SHIPPING_PRESETS = [
  { label: 'None',          value: 0 },
  { label: 'PWE',           value: 0.68 },
  { label: 'Bubble Mailer', value: 4.50 },
  { label: 'Small Box',     value: 8.50 },
]

interface BulkRow {
  id: number
  card_name: string
  cost: string
  price: string
  qty: string
  platform: string
}

let nextId = 1

export default function ProfitCalculatorPage() {
  const [tab, setTab] = useState<'single' | 'bulk' | 'reverse'>('single')

  // Single calc
  const [cost,     setCost]     = useState('')
  const [price,    setPrice]    = useState('')
  const [qty,      setQty]      = useState('1')
  const [platform, setPlatform] = useState('eBay')
  const [shipping, setShipping] = useState('0')

  // Bulk calc
  const [rows, setRows] = useState<BulkRow[]>([
    { id: nextId++, card_name: '', cost: '', price: '', qty: '1', platform: 'eBay' }
  ])

  // Reverse calc
  const [rCost,     setRCost]     = useState('')
  const [rPlatform, setRPlatform] = useState('eBay')
  const [rRoi,      setRRoi]      = useState('30')
  const [rShipping, setRShipping] = useState('0')

  // Single calc
  const costN     = parseFloat(cost)     || 0
  const priceN    = parseFloat(price)    || 0
  const qtyN      = parseInt(qty)        || 1
  const shippingN = parseFloat(shipping) || 0
  const fee       = PLATFORM_FEES[platform] ?? 0.10
  const feeAmt    = priceN * fee
  const profitPer = priceN - feeAmt - costN - shippingN
  const margin    = priceN > 0 ? (profitPer / priceN) * 100 : 0
  const roi       = costN  > 0 ? (profitPer / costN)  * 100 : 0
  const totalProfit = profitPer * qtyN
  const isProfit  = profitPer > 0
  const breakEven = costN > 0 ? (costN + shippingN) / (1 - fee) : 0

  // Fee breakdown for bar
  const totalDeductions = feeAmt + costN + shippingN
  const feePct     = priceN > 0 ? (feeAmt / priceN) * 100 : 0
  const costPct    = priceN > 0 ? (costN / priceN) * 100 : 0
  const shipPct    = priceN > 0 ? (shippingN / priceN) * 100 : 0
  const profitPct  = priceN > 0 ? Math.max((profitPer / priceN) * 100, 0) : 0

  // Bulk calc
  function addRow() {
    setRows(r => [...r, { id: nextId++, card_name: '', cost: '', price: '', qty: '1', platform: 'eBay' }])
  }
  function removeRow(id: number) {
    setRows(r => r.filter(row => row.id !== id))
  }
  function updateRow(id: number, field: keyof BulkRow, value: string) {
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row))
  }
  const bulkResults = rows.map(row => {
    const c = parseFloat(row.cost) || 0
    const p = parseFloat(row.price) || 0
    const q = parseInt(row.qty) || 1
    const f = PLATFORM_FEES[row.platform] ?? 0.10
    const profit = (p - p * f - c) * q
    return { ...row, profit, costN: c, priceN: p, qtyN: q }
  })
  const bulkTotal = bulkResults.reduce((s, r) => s + r.profit, 0)

  // Reverse calc
  const rCostN     = parseFloat(rCost)     || 0
  const rRoiN      = parseFloat(rRoi)      || 0
  const rShippingN = parseFloat(rShipping) || 0
  const rFee       = PLATFORM_FEES[rPlatform] ?? 0.10
  const rTargetProfit = rCostN * (rRoiN / 100)
  const rSellPrice = rCostN > 0 ? (rCostN + rTargetProfit + rShippingN) / (1 - rFee) : 0
  const rFeeAmt    = rSellPrice * rFee

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Profit Calculator</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">Estimate margins before listing</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f3f0ec] rounded-xl p-1 mb-6 w-fit">
          {(['single', 'bulk', 'reverse'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-white text-[#28251d] shadow-sm' : 'text-[#7a7974] hover:text-[#28251d]'
              }`}>
              {t === 'single' ? '🧮 Single' : t === 'bulk' ? '📦 Bulk' : '🎯 Reverse'}
            </button>
          ))}
        </div>

        {/* SINGLE CALCULATOR */}
        {tab === 'single' && (
          <div className="bg-white rounded-xl border border-black/8 p-6 space-y-5">
            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-2">Platform</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PLATFORM_FEES).map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      platform === p
                        ? 'bg-[#01696f] text-white border-[#01696f]'
                        : 'bg-white text-[#7a7974] border-black/12 hover:border-[#01696f] hover:text-[#01696f]'
                    }`}>
                    {p}
                    <span className="ml-1.5 text-xs opacity-70">{(PLATFORM_FEES[p] * 100).toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Your Cost ($)</label>
                <input value={cost} onChange={e => setCost(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Sell Price ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Quantity</label>
                <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" placeholder="1"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Shipping ($)</label>
                <div className="flex gap-1">
                  <input value={shipping} onChange={e => setShipping(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {SHIPPING_PRESETS.map(s => (
                    <button key={s.label} onClick={() => setShipping(String(s.value))}
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                        shipping === String(s.value)
                          ? 'bg-[#cedcd8] text-[#01696f] border-[#01696f]/20'
                          : 'bg-[#f3f0ec] text-[#7a7974] border-transparent hover:border-[#01696f]/20'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Breakdown Bar */}
            {priceN > 0 && (
              <div>
                <p className="text-xs font-medium text-[#7a7974] mb-2">Price Breakdown</p>
                <div className="flex h-4 rounded-full overflow-hidden gap-px">
                  <div className="bg-red-400 transition-all" style={{ width: `${costPct}%` }} title={`Cost: ${formatCurrency(costN)}`} />
                  <div className="bg-orange-400 transition-all" style={{ width: `${feePct}%` }} title={`Fees: ${formatCurrency(feeAmt)}`} />
                  <div className="bg-yellow-400 transition-all" style={{ width: `${shipPct}%` }} title={`Shipping: ${formatCurrency(shippingN)}`} />
                  <div className="bg-green-500 transition-all" style={{ width: `${profitPct}%` }} title={`Profit: ${formatCurrency(profitPer)}`} />
                </div>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {[
                    { label: 'Cost', color: 'bg-red-400', val: costN },
                    { label: 'Fees', color: 'bg-orange-400', val: feeAmt },
                    { label: 'Shipping', color: 'bg-yellow-400', val: shippingN },
                    { label: 'Profit', color: 'bg-green-500', val: profitPer },
                  ].map(({ label, color, val }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                      <span className="text-xs text-[#7a7974]">{label}: <strong className="tabular-nums">{formatCurrency(val)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <div className={`rounded-xl p-5 border ${isProfit ? 'bg-green-50 border-green-100' : priceN > 0 ? 'bg-red-50 border-red-100' : 'bg-[#f9f8f5] border-black/8'}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7a7974] mb-3">Estimated Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7a7974]">Sale Price</span>
                  <span className="tabular-nums font-medium">{formatCurrency(priceN)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a7974]">Platform Fee ({(fee * 100).toFixed(2)}%)</span>
                  <span className="tabular-nums text-red-500">− {formatCurrency(feeAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a7974]">Shipping</span>
                  <span className="tabular-nums text-red-500">− {formatCurrency(shippingN)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7a7974]">Your Cost</span>
                  <span className="tabular-nums text-red-500">− {formatCurrency(costN)}</span>
                </div>
                <div className="border-t border-black/10 pt-2 flex justify-between font-semibold text-base">
                  <span>Net per card</span>
                  <span className={`tabular-nums ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profitPer)}</span>
                </div>
                {qtyN > 1 && (
                  <div className="flex justify-between font-bold text-base">
                    <span>Total × {qtyN}</span>
                    <span className={`tabular-nums ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/10">
                <div>
                  <p className="text-xs text-[#7a7974] mb-0.5">Margin</p>
                  <p className={`text-xl font-bold tabular-nums ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#7a7974] mb-0.5">ROI</p>
                  <p className={`text-xl font-bold tabular-nums ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Break-even */}
            {costN > 0 && (
              <p className="text-xs text-[#7a7974] bg-[#f3f0ec] rounded-lg px-4 py-3">
                💡 Break-even price on {platform}: <strong className="tabular-nums">{formatCurrency(breakEven)}</strong>
              </p>
            )}
          </div>
        )}

        {/* BULK CALCULATOR */}
        {tab === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-black/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8 bg-[#f9f8f5]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Card Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Platform</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Cost</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Sell Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Qty</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Profit</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      const result = bulkResults.find(r => r.id === row.id)!
                      return (
                        <tr key={row.id} className="border-b border-black/5 last:border-0">
                          <td className="px-4 py-2">
                            <input value={row.card_name} onChange={e => updateRow(row.id, 'card_name', e.target.value)}
                              placeholder="Card name" className="w-full px-2 py-1.5 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
                          </td>
                          <td className="px-4 py-2">
                            <select value={row.platform} onChange={e => updateRow(row.id, 'platform', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
                              {Object.keys(PLATFORM_FEES).map(p => <option key={p}>{p}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input value={row.cost} onChange={e => updateRow(row.id, 'cost', e.target.value)}
                              type="number" step="0.01" min="0" placeholder="0.00"
                              className="w-full px-2 py-1.5 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums text-right" />
                          </td>
                          <td className="px-4 py-2">
                            <input value={row.price} onChange={e => updateRow(row.id, 'price', e.target.value)}
                              type="number" step="0.01" min="0" placeholder="0.00"
                              className="w-full px-2 py-1.5 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums text-right" />
                          </td>
                          <td className="px-4 py-2">
                            <input value={row.qty} onChange={e => updateRow(row.id, 'qty', e.target.value)}
                              type="number" min="1" placeholder="1"
                              className="w-20 px-2 py-1.5 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums text-right" />
                          </td>
                          <td className={`px-4 py-2 text-right tabular-nums font-semibold ${result.profit > 0 ? 'text-green-600' : result.profit < 0 ? 'text-red-500' : 'text-[#7a7974]'}`}>
                            {result.priceN > 0 ? formatCurrency(result.profit) : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <button onClick={() => removeRow(row.id)} className="p-1.5 rounded hover:bg-red-50 text-[#bab9b4] hover:text-red-500 transition-colors">✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-black/5 bg-[#f9f8f5] flex items-center justify-between">
                <button onClick={addRow} className="text-sm text-[#01696f] font-medium hover:underline">+ Add Row</button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7a7974]">Total Profit:</span>
                  <span className={`text-sm font-bold tabular-nums ${bulkTotal > 0 ? 'text-green-600' : bulkTotal < 0 ? 'text-red-500' : 'text-[#7a7974]'}`}>
                    {formatCurrency(bulkTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVERSE CALCULATOR */}
        {tab === 'reverse' && (
          <div className="bg-white rounded-xl border border-black/8 p-6 space-y-5">
            <p className="text-sm text-[#7a7974]">Enter your cost and target ROI — we'll tell you what to charge.</p>

            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-2">Platform</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PLATFORM_FEES).map(p => (
                  <button key={p} onClick={() => setRPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      rPlatform === p
                        ? 'bg-[#01696f] text-white border-[#01696f]'
                        : 'bg-white text-[#7a7974] border-black/12 hover:border-[#01696f] hover:text-[#01696f]'
                    }`}>
                    {p}
                    <span className="ml-1.5 text-xs opacity-70">{(PLATFORM_FEES[p] * 100).toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Your Cost ($)</label>
                <input value={rCost} onChange={e => setRCost(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Target ROI (%)</label>
                <input value={rRoi} onChange={e => setRRoi(e.target.value)} type="number" step="1" min="0" placeholder="30"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#28251d] mb-1.5">Shipping ($)</label>
                <input value={rShipping} onChange={e => setRShipping(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular-nums" />
                <div className="flex gap-1 mt-1 flex-wrap">
                  {SHIPPING_PRESETS.map(s => (
                    <button key={s.label} onClick={() => setRShipping(String(s.value))}
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                        rShipping === String(s.value)
                          ? 'bg-[#cedcd8] text-[#01696f] border-[#01696f]/20'
                          : 'bg-[#f3f0ec] text-[#7a7974] border-transparent hover:border-[#01696f]/20'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {rCostN > 0 && (
              <div className="rounded-xl bg-[#cedcd8] border border-[#01696f]/20 p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#01696f] mb-1">Recommended Pricing</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-[#01696f] tabular-nums">{formatCurrency(rSellPrice)}</p>
                  <p className="text-sm text-[#7a7974]">to hit {rRoiN}% ROI on {rPlatform}</p>
                </div>
                <div className="space-y-1.5 text-sm border-t border-[#01696f]/20 pt-3">
                  <div className="flex justify-between">
                    <span className="text-[#7a7974]">Sale Price</span>
                    <span className="tabular-nums font-medium">{formatCurrency(rSellPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7a7974]">Platform Fee ({(rFee * 100).toFixed(2)}%)</span>
                    <span className="tabular-nums text-red-500">− {formatCurrency(rFeeAmt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7a7974]">Shipping</span>
                    <span className="tabular-nums text-red-500">− {formatCurrency(rShippingN)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7a7974]">Your Cost</span>
                    <span className="tabular-nums text-red-500">− {formatCurrency(rCostN)}</span>
                  </div>
                  <div className="border-t border-[#01696f]/20 pt-1.5 flex justify-between font-bold">
                    <span>Your Profit</span>
                    <span className="tabular-nums text-green-600">{formatCurrency(rTargetProfit)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}