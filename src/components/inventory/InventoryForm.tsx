'use client'
import { useState, useEffect, useRef } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem } from '@/types'
import { Loader2, ImageOff, CheckCircle2 } from 'lucide-react'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG', 'PSA 10', 'PSA 9', 'PSA 8', 'BGS 10', 'BGS 9.5', 'BGS 9']
const PLATFORMS  = ['eBay', 'TCGPlayer', 'Facebook', 'Local', 'Other']
const STATUSES   = ['in_stock', 'listed', 'sold']
const GAMES      = ['Pokemon', 'MTG', 'Yu-Gi-Oh', 'Other']

interface Candidate {
  id: string
  card_name: string
  set_name: string | null
  card_number: string
  image_url: string | null
  price: number | null
}

interface Props {
  userId: string
  item?: InventoryItem
  onSuccess: () => void
}

export default function InventoryForm({ userId, item, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [imageUrl, setImageUrl]       = useState<string | null>((item as any)?.image_url ?? null)
  const [imageLookingUp, setImageLookingUp] = useState(false)
  const [candidates, setCandidates]   = useState<Candidate[]>([])
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const lookupTimer = useRef<NodeJS.Timeout>()

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
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  // Auto-fetch candidates when card_name / set_name / game changes
  useEffect(() => {
    if (!form.card_name || form.card_name.length < 3) {
      setCandidates([])
      return
    }
    clearTimeout(lookupTimer.current)
    lookupTimer.current = setTimeout(async () => {
      setImageLookingUp(true)
      setCandidates([])
      try {
        const res = await fetch('/api/price-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_name: form.card_name,
            set_name: form.set_name || null,
            card_number: null,
            game: form.game,
          }),
        })
        const data = await res.json()
        if (data.candidates?.length) {
          setCandidates(data.candidates)
          // Auto-select first
          selectCandidate(data.candidates[0])
          setSelectedId(data.candidates[0].id)
        }
      } catch {}
      setImageLookingUp(false)
    }, 800)
    return () => clearTimeout(lookupTimer.current)
  }, [form.card_name, form.set_name, form.game])

  function selectCandidate(c: Candidate) {
    setSelectedId(c.id)
    setImageUrl(c.image_url)
    if (c.set_name) setForm(f => ({ ...f, set_name: c.set_name! }))
    if (c.price)    setForm(f => ({ ...f, listed_price: String(c.price) }))
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
      image_url:    imageUrl ?? null,
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

        {/* ── Image Picker ── */}
        <div className="col-span-2">
          <p className="text-xs font-medium text-[#7a7974] mb-2">
            Card Image {imageLookingUp && <span className="text-[#01696f]">· Searching…</span>}
          </p>

          {imageLookingUp ? (
            <div className="flex items-center gap-2 h-24 justify-center bg-[#f9f8f5] rounded-xl border border-black/8">
              <Loader2 size={16} className="animate-spin text-[#01696f]" />
              <span className="text-xs text-[#7a7974]">Finding matches…</span>
            </div>
          ) : candidates.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {candidates.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCandidate(c)}
                  className={`relative rounded-xl border-2 transition-all overflow-hidden bg-[#f9f8f5] shrink-0
                    ${selectedId === c.id
                      ? 'border-[#01696f] shadow-md scale-105'
                      : 'border-transparent hover:border-[#cedcd8]'}`}
                  title={`${c.card_name} · ${c.set_name ?? ''} · #${c.card_number}`}
                >
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.card_name}
                      className="w-16 h-[88px] object-contain"
                    />
                  ) : (
                    <div className="w-16 h-[88px] flex items-center justify-center">
                      <ImageOff size={14} className="text-[#bab9b4]" />
                    </div>
                  )}
                  {selectedId === c.id && (
                    <div className="absolute top-1 right-1 bg-[#01696f] rounded-full p-0.5">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                  <p className="text-[10px] text-center text-[#7a7974] px-1 pb-1 leading-tight truncate w-16">
                    #{c.card_number}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 h-16 px-4 bg-[#f9f8f5] rounded-xl border border-black/8">
              <div className="w-10 h-[56px] rounded-lg bg-[#f0ede9] flex items-center justify-center">
                <ImageOff size={14} className="text-[#bab9b4]" />
              </div>
              <p className="text-xs text-[#7a7974]">
                {form.card_name.length >= 3
                  ? 'No matches found — try a different name or set'
                  : 'Type a card name to search for images'}
              </p>
            </div>
          )}

          {candidates.length > 0 && (
            <p className="text-xs text-[#7a7974] mt-1.5">
              {candidates.length} match{candidates.length > 1 ? 'es' : ''} found · tap to select the correct card
            </p>
          )}
        </div>

        {/* ── Form Fields ── */}
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
        <Input label="Listed Price ($)" type="number" step="0.01" min="0" value={form.listed_price} onChange={update('listed_price')} placeholder="Auto-filled" />
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