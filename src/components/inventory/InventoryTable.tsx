'use client'
import { useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { InventoryItem } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import InventoryForm from './InventoryForm'
import { formatCurrency, calcProfit } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function InventoryTable({ items, userId }: { items: InventoryItem[], userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = item.card_name.toLowerCase().includes(q) || (item.set_name ?? '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return
    await supabase.from('inventory').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bab9b4]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards or sets…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold</option>
        </select>
        <Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add Card</Button>
      </div>

      <div className="bg-white rounded-xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-[#f9f8f5]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Card</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden md:table-cell">Set</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Cond.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden sm:table-cell">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden lg:table-cell">Listed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden lg:table-cell">Sold</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden xl:table-cell">Profit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden md:table-cell">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-sm text-[#7a7974]">No cards found. Add your first card!</td></tr>
              ) : filtered.map(item => {
                const profit = calcProfit(item.cost, item.sold_price)
                return (
                  <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-[#f9f8f5] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#28251d]">{item.card_name}</td>
                    <td className="px-4 py-3 text-[#7a7974] hidden md:table-cell">{item.set_name ?? '—'}</td>
                    <td className="px-4 py-3"><Badge value={item.condition} /></td>
                    <td className="px-4 py-3 text-right tabular text-[#28251d] hidden sm:table-cell">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular text-[#28251d]">{formatCurrency(item.cost)}</td>
                    <td className="px-4 py-3 text-right tabular text-[#7a7974] hidden lg:table-cell">{formatCurrency(item.listed_price)}</td>
                    <td className="px-4 py-3 text-right tabular text-[#28251d] hidden lg:table-cell">{formatCurrency(item.sold_price)}</td>
                    <td className={`px-4 py-3 text-right tabular font-medium hidden xl:table-cell ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-500' : 'text-[#7a7974]'}`}>
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