'use client'
import { useState, useRef } from 'react'
import { Upload, X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface ScannedCard {
  id: string
  file: File
  preview: string
  status: 'scanning' | 'pricing' | 'ready' | 'error' | 'saved'
  card_name?: string
  set_name?: string
  game?: string
  condition?: string
  rarity?: string
  price?: number | null
  image_url?: string | null
  error?: string
  cost: string
}

interface Props {
  userId: string
  onSuccess: () => void
}

export default function CardScanner({ userId, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [cards, setCards] = useState<ScannedCard[]>([])
  const [saving, setSaving] = useState(false)

  function updateCard(id: string, updates: Partial<ScannedCard>) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  async function processFile(file: File) {
    const id = crypto.randomUUID()
    const preview = URL.createObjectURL(file)

    setCards(prev => [...prev, {
      id, file, preview, status: 'scanning', cost: '0'
    }])

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Step 1: Scan with GPT-4o Vision
      const scanRes = await fetch('/api/scan-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const scanData = await scanRes.json()
      if (scanData.error) throw new Error(scanData.error)

      updateCard(id, { ...scanData.card, status: 'pricing' })

      // Step 2: Price lookup
      const priceRes = await fetch('/api/price-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_name: scanData.card.card_name,
          set_name: scanData.card.set_name,
          game: scanData.card.game,
        }),
      })
      const priceData = await priceRes.json()

      updateCard(id, {
        price: priceData.price,
        image_url: priceData.image_url,
        status: 'ready',
        cost: priceData.price ? String(priceData.price) : '0',
      })

    } catch (err: any) {
      updateCard(id, { status: 'error', error: err.message })
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(processFile)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  async function saveAll() {
    const readyCards = cards.filter(c => c.status === 'ready')
    if (readyCards.length === 0) return
    setSaving(true)

    const payload = readyCards.map(c => ({
      user_id: userId,
      card_name: c.card_name ?? 'Unknown',
      set_name: c.set_name ?? null,
      game: c.game ?? 'Other',
      condition: c.condition ?? 'NM',
      quantity: 1,
      cost: Number(c.cost) || 0,
      listed_price: c.price ?? null,
      sold_price: null,
      platform: null,
      status: 'in_stock',
      notes: c.rarity ?? null,
    }))

    const { error } = await supabase.from('inventory').insert(payload)
    if (!error) {
      setCards([])
      router.refresh()
      onSuccess()
    }
    setSaving(false)
  }

  const readyCount = cards.filter(c => c.status === 'ready').length

  return (
    <div className="space-y-4">

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#cedcd8] rounded-xl p-8 text-center cursor-pointer hover:border-[#01696f] hover:bg-[#f0fafa] transition-colors"
      >
        <Upload size={24} className="mx-auto mb-2 text-[#01696f]" />
        <p className="text-sm font-medium text-[#28251d]">Drop card scans here</p>
        <p className="text-xs text-[#7a7974] mt-1">or click to browse — JPG, PNG supported</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Scanned Cards */}
      {cards.length > 0 && (
        <div className="space-y-3">
          {cards.map(card => (
            <div key={card.id} className="bg-white rounded-xl border border-black/8 p-4">
              <div className="flex gap-4">

                {/* Preview Image */}
                <img
                  src={card.image_url ?? card.preview}
                  alt="card"
                  className="w-16 h-22 object-contain rounded-lg border border-black/8 shrink-0"
                />

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  {card.status === 'scanning' && (
                    <div className="flex items-center gap-2 text-sm text-[#7a7974]">
                      <Loader2 size={14} className="animate-spin text-[#01696f]" />
                      Identifying card...
                    </div>
                  )}
                  {card.status === 'pricing' && (
                    <div className="flex items-center gap-2 text-sm text-[#7a7974]">
                      <Loader2 size={14} className="animate-spin text-[#01696f]" />
                      Fetching price...
                    </div>
                  )}
                  {card.status === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle size={14} />
                      {card.error ?? 'Failed to scan'}
                    </div>
                  )}
                  {(card.status === 'ready' || card.status === 'saved') && (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#28251d]">{card.card_name}</p>
                          <p className="text-xs text-[#7a7974]">{card.set_name} · {card.game} · {card.condition}</p>
                          {card.rarity && <p className="text-xs text-[#bab9b4]">{card.rarity}</p>}
                        </div>
                        {card.status === 'saved'
                          ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                          : <button onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))}
                              className="p-1 rounded hover:bg-[#f3f0ec] text-[#bab9b4] hover:text-[#28251d] transition-colors">
                              <X size={14} />
                            </button>
                        }
                      </div>

                      {/* Price + Cost */}
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-[#7a7974]">Market Price</p>
                          <p className="text-sm font-bold text-[#01696f]">
                            {card.price ? formatCurrency(card.price) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#7a7974] mb-1">Your Cost ($)</p>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={card.cost}
                            onChange={e => updateCard(card.id, { cost: e.target.value })}
                            className="w-24 px-2 py-1 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Save All Button */}
          {readyCount > 0 && (
            <button
              onClick={saveAll}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                : <><Plus size={16} /> Add {readyCount} Card{readyCount > 1 ? 's' : ''} to Inventory</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}