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

export default function ProfitCalculatorPage() {
  const [cost,     setCost]     = useState('')
  const [price,    setPrice]    = useState('')
  const [qty,      setQty]      = useState('1')
  const [platform, setPlatform] = useState('eBay')

  const costN  = parseFloat(cost)  || 0
  const priceN = parseFloat(price) || 0
  const qtyN   = parseInt(qty)     || 1
  const fee    = PLATFORM_FEES[platform] ?? 0.10

  const feeAmt      = priceN * fee
  const profitPer   = priceN - feeAmt - costN
  const margin      = priceN > 0 ? (profitPer / priceN) * 100 : 0
  const roi         = costN   > 0 ? (profitPer / costN)  * 100 : 0
  const totalProfit = profitPer * qtyN
  const isProfit    = profitPer > 0

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Profit Calculator</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">Estimate margins before listing</p>
        </div>

        <div className="bg-white rounded-xl border border-black/8 p-6 space-y-5">

          {/* Platform selector */}
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-1.5">Your Cost ($)</label>
              <input value={cost} onChange={e => setCost(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-1.5">Sell Price ($)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#28251d] mb-1.5">Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" placeholder="1"
                className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 tabular" />
            </div>
          </div>

          {/* Results */}
          <div className={`rounded-xl p-5 border ${isProfit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7a7974] mb-3">Estimated Breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7a7974]">Sale Price</span>
                <span className="tabular font-medium">{formatCurrency(priceN)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7974]">Platform Fee ({(fee * 100).toFixed(2)}%)</span>
                <span className="tabular text-red-500">− {formatCurrency(feeAmt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7a7974]">Your Cost</span>
                <span className="tabular text-red-500">− {formatCurrency(costN)}</span>
              </div>
              <div className="border-t border-black/10 pt-2 flex justify-between font-semibold text-base">
                <span>Net per card</span>
                <span className={`tabular ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profitPer)}</span>
              </div>
              {qtyN > 1 && (
                <div className="flex justify-between font-bold text-base">
                  <span>Total × {qtyN}</span>
                  <span className={`tabular ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/10">
              <div>
                <p className="text-xs text-[#7a7974] mb-0.5">Margin</p>
                <p className={`text-xl font-bold tabular ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-[#7a7974] mb-0.5">ROI</p>
                <p className={`text-xl font-bold tabular ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Break-even hint */}
          {costN > 0 && (
            <p className="text-xs text-[#7a7974] bg-[#f3f0ec] rounded-lg px-4 py-3">
              💡 Break-even price on {platform}: <strong className="tabular">{formatCurrency(costN / (1 - fee))}</strong>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  )
}