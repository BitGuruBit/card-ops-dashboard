'use client'
import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import type { InventoryItem } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import InventoryForm from './InventoryForm'
import { formatCurrency, calcProfit } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type SortField = 'card_name' | 'game' | 'cost' | 'listed_price' | 'sold_price' | 'profit'
type SortDir = 'asc' | 'desc'

const GAME_COLORS: Record<string, string> = {
  'Pokemon':  'bg-[#cedcd8] text-[#01696f]',
  'MTG':      'bg-[#ddcfc6] text-[#964219]',
  'Yu-Gi-Oh': 'bg-[#e9e0c6] text-[#d19900]',
  'Other':    'bg-[#f3f0ec] text-[#7a7974]',
}

export default function InventoryTable({ items, userId }: { items: InventoryItem[], userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gameFilter, setGameFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('card_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-[#dcd9d5]" />
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-[#01696f]" /> : <ChevronDown size={12} className="text-[#01696f]" />
  }

  const filtered = items
    .filter(item => {
      const q = search.toLowerCase()
      const matchSearch = item.card_name.toLowerCase().includes(q) || (item.set_name ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      const matchGame = gameFilter === 'all' || (item as any).game === gameFilter
      return matchSearch && matchStatus && matchGame
    })
    .sort((a: any, b: any) => {
      let valA: any, valB: any
      if (sortField === 'profit') {
        valA = calcProfit(a.cost, a.sold_price)
        valB = calcProfit(b.cost, b.sold_price)
      } else {
        valA = a[sortField] ?? ''
        valB = b[sortField] ?? ''
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const totalCost = filtered.reduce((s: number, i: any) => s + (i.cost ?? 0), 0)
  const totalListedValue = filtered.filter((i: any) => i.status !== 'sold').reduce((s: number, i: any) => s + ((i.listed_price ?? i.cost ?? 0) * (i.quantity ?? 1)), 0)
  const totalProfit = filtered.filter((i: any) => i.status === 'sold').reduce((s: number, i: any) => s + calcProfit(i.cost, i.sold_price), 0)

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    await supabase.from('inventory').delete().eq('id', id)
    router.refresh()
  }

  const games = ['Pokemon', 'MTG', 'Yu-Gi-Oh', 'Other']

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bab9b4]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards or sets…"
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
        </div>
        <div className="flex gap-2">
          <select value={gameFilter} onChange={e => setGameFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            <option value="all">All Games</option>
            {games.map(g => <option key={g}>{g}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2.5 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="listed">Listed</option>
            <option value="sold">Sold</option>
          </select>
          <Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add</Button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-black/8 px-3 py-3 md:px-4">
          <p className="text-xs text-[#7a7974]">Cost Basis</p>
          <p className="text-sm md:text-base font-bold text-[#28251d] tabular-nums">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 px-3 py-3 md:px-4">
          <p className="text-xs text-[#7a7974]">Active Value</p>
          <p className="text-sm md:text-base font-bold text-[#28251d] tabular-nums">{formatCurrency(totalListedValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-black/8 px-3 py-3 md:px-4">
          <p className="text-xs text-[#7a7974]">Profit</p>
          <p className={`text-sm md:text-base font-bold tabular-nums ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      {/* ── MOBILE CARD LIST (below md) ── */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/8 py-12 text-center">
            <p className="text-sm font-medium text-[#7a7974] mb-1">No cards found</p>
            <p className="text-xs text-[#bab9b4]">Try adjusting filters or add a card</p>
          </div>
        ) : filtered.map(item => {
          const profit = calcProfit(item.cost, item.sold_price)
          const game = (item as any).game ?? 'Other'
          return (
            <div key={item.id} className="bg-white rounded-xl border border-black/8 px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#28251d] truncate">{item.card_name}</p>
                  <p className="text-xs text-[#7a7974]">{item.set_name ?? '—'} · {item.condition} · Qty: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditItem(item)}
                    className="p-2 rounded-lg hover:bg-[#f3f0ec] text-[#7a7974] hover:text-[#28251d] transition-colors" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-[#7a7974] hover:text-red-600 transition-colors" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${GAME_COLORS[game] ?? GAME_COLORS['Other']}`}>{game}</span>
                <Badge value={item.status} />
                {item.platform && <Badge value={item.platform} />}
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[#bab9b4]">Cost </span>
                  <span className="font-semibold text-[#28251d] tabular-nums">{formatCurrency(item.cost)}</span>
                </div>
                {item.listed_price && item.status !== 'sold' && (
                  <div>
                    <span className="text-[#bab9b4]">Listed </span>
                    <span className="font-semibold text-[#01696f] tabular-nums">{formatCurrency(item.listed_price)}</span>
                  </div>
                )}
                {item.status === 'sold' && (
                  <div>
                    <span className="text-[#bab9b4]">Sold </span>
                    <span className="font-semibold text-[#28251d] tabular-nums">{formatCurrency(item.sold_price)}</span>
                  </div>
                )}
                {item.status === 'sold' && (
                  <div>
                    <span className="text-[#bab9b4]">Profit </span>
                    <span className={`font-semibold tabular-nums ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(profit)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <p className="text-xs text-[#7a7974] px-1 pt-1">{filtered.length} of {items.length} cards</p>
      </div>

      {/* ── DESKTOP TABLE (md and above) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-[#f9f8f5]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">
                  <button onClick={() => handleSort('card_name')} className="flex items-center gap-1 hover:text-[#28251d]">Card <SortIcon field="card_name" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden md:table-cell">Set</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden lg:table-cell">
                  <button onClick={() => handleSort('game')} className="flex items-center gap-1 hover:text-[#28251d]">Game <SortIcon field="game" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Cond.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden sm:table-cell">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">
                  <button onClick={() => handleSort('cost')} className="flex items-center gap-1 hover:text-[#28251d] ml-auto">Cost <SortIcon field="cost" /></button>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden lg:table-cell">
                  <button onClick={() => handleSort('listed_price')} className="flex items-center gap-1 hover:text-[#28251d] ml-auto">Listed <SortIcon field="listed_price" /></button>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden lg:table-cell">
                  <button onClick={() => handleSort('sold_price')} className="flex items-center gap-1 hover:text-[#28251d] ml-auto">Sold <SortIcon field="sold_price" /></button>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden xl:table-cell">
                  <button onClick={() => handleSort('profit')} className="flex items-center gap-1 hover:text-[#28251d] ml-auto">Profit <SortIcon field="profit" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden md:table-cell">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-sm text-[#7a7974]">
                    <p className="font-medium mb-1">No cards found</p>
                    <p className="text-xs">Try adjusting your filters or add a new card</p>
                  </td>
                </tr>
              ) : filtered.map(item => {
                const profit = calcProfit(item.cost, item.sold_price)
                const game = (item as any).game ?? 'Other'
                return (
                  <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-[#f9f8f5] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#28251d]">{item.card_name}</td>
                    <td className="px-4 py-3 text-[#7a7974] hidden md:table-cell">{item.set_name ?? '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${GAME_COLORS[game] ?? GAME_COLORS['Other']}`}>{game}</span>
                    </td>
                    <td className="px-4 py-3"><Badge value={item.condition} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#28251d] hidden sm:table-cell">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#28251d]">{formatCurrency(item.cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#7a7974] hidden lg:table-cell">{formatCurrency(item.listed_price)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#28251d] hidden lg:table-cell">{formatCurrency(item.sold_price)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium hidden xl:table-cell ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-500' : 'text-[#7a7974]'}`}>
                      {item.status === 'sold' ? formatCurrency(profit) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{item.platform ? <Badge value={item.platform} /> : '—'}</td>
                    <td className="px-4 py-3"><Badge value={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditItem(item)} className="p-1.5 rounded hover:bg-[#f3f0ec] text-[#7a7974] hover:text-[#28251d] transition-colors" aria-label="Edit"><Pencil size={13} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-red-50 text-[#7a7974] hover:text-red-600 transition-colors" aria-label="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-black/5 bg-[#f9f8f5]">
          <p className="text-xs text-[#7a7974]">{filtered.length} of {items.length} cards</p>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Card">
        <InventoryForm userId={userId} onSuccess={() => { setAddOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Card">
        {editItem && <InventoryForm userId={userId} item={editItem} onSuccess={() => { setEditItem(null); router.refresh() }} />}
      </Modal>
    </>
  )
}