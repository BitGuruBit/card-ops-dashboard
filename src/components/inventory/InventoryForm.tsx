'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem } from '@/types'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS 10', 'BGS 9.5', 'BGS 9']
const PLATFORMS  = ['eBay', 'TCGPlayer', 'Facebook', 'Local', 'Other']
const STATUSES   = ['in_stock', 'listed', 'sold']
const GAMES      = ['Pokemon', 'MTG', 'Yu-Gi-Oh', 'Other']

interface Props {
  userId: string
  item?: InventoryItem
  onSuccess: () => void
}

export default function InventoryForm({ userId, item, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    card_name:    item?.card_name    ?? '',
    set_name:     item?.set_name     ?? '',
    game:         (item as any)?.game ?? 'Pokemon',
    condition:    item?.condition    ?? 'NM',
    quantity:     item?.quantity     ?? 1,
    cost:         item?.cost         ?? 0,
    listed_price: item?.listed_price ?? '',
    sold_price:   item?.sold_price   ?? '',
    platform:     item?.platform     ?? '',
    status:       item?.status       ?? 'in_stock',
    notes:        item?.notes        ?? '',
  })

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      user_id:      userId,
      card_name:    form.card_name,
      set_name:     form.set_name || null,
      game:         form.game,
      condition:    form.condition,
      quantity:     Number(form.quantity),
      cost:         Number(form.cost),
      listed_price: form.listed_price !== '' ? Number(form.listed_price) : null,
      sold_price:   form.sold_price   !== '' ? Number(form.sold_price)   : null,
      platform:     form.platform || null,
      status:       form.status,
      notes:        form.notes || null,
    }
    const { error } = item
      ? await supabase.from('inventory').update(payload).eq('id', item.id)
      : await supabase.from('inventory').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Card Name *" value={form.card_name} onChange={update('card_name')} required placeholder="e.g. Charizard VMAX" />
        </div>
        <Input label="Set" value={form.set_name} onChange={update('set_name')} placeholder="e.g. Evolving Skies" />
        <div>
          <label className="block text-sm font-medium text-[#28251d] mb-1.5">Game</label>
          <select value={form.game} onChange={update('game')} className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            {GAMES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#28251d] mb-1.5">Condition</label>
          <select value={form.condition} onChange={update('condition')} className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Quantity" type="number" min="0" value={form.quantity} onChange={update('quantity')} />
        <Input label="Your Cost ($) *" type="number" step="0.01" min="0" value={form.cost} onChange={update('cost')} required />
        <Input label="Listed Price ($)" type="number" step="0.01" min="0" value={form.listed_price} onChange={update('listed_price')} placeholder="Optional" />
        <Input label="Sold Price ($)" type="number" step="0.01" min="0" value={form.sold_price} onChange={update('sold_price')} placeholder="Optional" />
        <div>
          <label className="block text-sm font-medium text-[#28251d] mb-1.5">Platform</label>
          <select value={form.platform} onChange={update('platform')} className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            <option value="">— None —</option>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#28251d] mb-1.5">Status</label>
          <select value={form.status} onChange={update('status')} className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[#28251d] mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={update('notes')} rows={2} className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 resize-none" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : item ? 'Save Changes' : 'Add Card'}
        </Button>
      </div>
    </form>
  )
}