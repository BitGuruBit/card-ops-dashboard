'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { ContentIdea } from '@/types'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

const PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'Twitch', 'Podcast', 'Other']
const STATUSES  = ['idea', 'scripting', 'filming', 'editing', 'scheduled', 'published']
const NICHES    = ['Pokemon Cards', 'MTG', 'Yu-Gi-Oh', 'Card Investing', 'Pack Opening', 'Card Grading', 'Reselling', 'Gaming', 'Unboxing', 'Cross-niche']

interface Props {
  userId: string
  item?: ContentIdea
  onSuccess: () => void
}

interface AIIdea {
  title: string
  seo_title: string
  description: string
  keywords: string
  hook: string
}

export default function ContentForm({ userId, item, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title:       item?.title       ?? '',
    platform:    item?.platform    ?? '',
    status:      item?.status      ?? 'idea',
    due_date:    item?.due_date    ?? '',
    notes:       item?.notes       ?? '',
    description: (item as any)?.description ?? '',
    keywords:    (item as any)?.keywords    ?? '',
    seo_title:   (item as any)?.seo_title   ?? '',
  })

  // AI generator state
  const [aiTopic,    setAiTopic]    = useState('')
  const [aiNiche,    setAiNiche]    = useState('Pokemon Cards')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiIdeas,    setAiIdeas]    = useState<AIIdea[]>([])
  const [aiError,    setAiError]    = useState('')
  const [aiOpen,     setAiOpen]     = useState(!item)

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function generateIdeas() {
    if (!aiTopic.trim()) { setAiError('Enter a topic first'); return }
    setAiLoading(true)
    setAiError('')
    setAiIdeas([])
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, platform: form.platform, niche: aiNiche }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiIdeas(data.ideas)
    } catch (e) {
      setAiError('Failed to generate ideas. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  function applyIdea(idea: AIIdea) {
    setForm(f => ({
      ...f,
      title:       idea.title,
      seo_title:   idea.seo_title,
      description: idea.description,
      keywords:    idea.keywords,
      notes:       `Hook: ${idea.hook}`,
    }))
    setAiOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      user_id:     userId,
      title:       form.title,
      platform:    form.platform || null,
      status:      form.status,
      due_date:    form.due_date || null,
      notes:       form.notes || null,
      description: form.description || null,
      keywords:    form.keywords || null,
      seo_title:   form.seo_title || null,
    }
    const { error } = item
      ? await supabase.from('content_ideas').update(payload).eq('id', item.id)
      : await supabase.from('content_ideas').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* AI Generator Panel */}
      <div className="border border-[#01696f]/20 rounded-xl overflow-hidden">
        <button type="button" onClick={() => setAiOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#cedcd8] hover:bg-[#c0d4d0] transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[#01696f]" />
            <span className="text-sm font-semibold text-[#01696f]">AI Idea Generator</span>
          </div>
          {aiOpen ? <ChevronUp size={14} className="text-[#01696f]" /> : <ChevronDown size={14} className="text-[#01696f]" />}
        </button>

        {aiOpen && (
          <div className="p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#28251d] mb-1">Topic or keyword</label>
                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. pack opening, card investing, grading tips..."
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#28251d] mb-1">Niche angle</label>
                <select value={aiNiche} onChange={e => setAiNiche(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#28251d] mb-1">Platform</label>
                <select value={form.platform} onChange={update('platform')}
                  className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
                  <option value="">Any</option>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <button type="button" onClick={generateIdeas} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              <Sparkles size={14} />
              {aiLoading ? 'Generating ideas…' : 'Generate 5 Ideas'}
            </button>

            {aiError && <p className="text-xs text-red-600">{aiError}</p>}

            {aiIdeas.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {aiIdeas.map((idea, i) => (
                  <div key={i} className="border border-black/8 rounded-lg p-3 hover:border-[#01696f]/30 hover:bg-[#f9f8f5] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-[#28251d] flex-1">{idea.title}</p>
                      <button type="button" onClick={() => applyIdea(idea)}
                        className="shrink-0 px-2.5 py-1 bg-[#01696f] text-white text-xs rounded-lg hover:bg-[#0c4e54] transition-colors">
                        Use
                      </button>
                    </div>
                    <p className="text-xs text-[#7a7974] mb-1.5">{idea.description}</p>
                    <p className="text-xs text-[#01696f] font-medium">🪝 {idea.hook}</p>
                    <p className="text-xs text-[#bab9b4] mt-1">🔑 {idea.keywords}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Form */}
      <Input label="Title *" value={form.title} onChange={update('title')} required placeholder="e.g. Pack Opening — Evolving Skies" />

      <div>
        <label className="block text-sm font-medium text-[#28251d] mb-1.5">SEO Title</label>
        <input value={form.seo_title} onChange={update('seo_title')} placeholder="Optimized title for search (auto-filled by AI)"
          className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#28251d] mb-1.5">Description</label>
        <textarea value={form.description} onChange={update('description')} rows={2}
          placeholder="SEO-friendly description (auto-filled by AI)"
          className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#28251d] mb-1.5">Keywords / Hashtags</label>
        <input value={form.keywords} onChange={update('keywords')} placeholder="keyword1, keyword2, #hashtag (auto-filled by AI)"
          className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
      </div>

      <Input label="Due Date" type="date" value={form.due_date} onChange={update('due_date')} />

      <div>
        <label className="block text-sm font-medium text-[#28251d] mb-1.5">Notes / Hook</label>
        <textarea value={form.notes} onChange={update('notes')} rows={2}
          className="w-full px-3 py-2 text-sm border border-black/12 rounded-lg bg-[#f9f8f5] focus:outline-none focus:ring-2 focus:ring-[#01696f]/40 resize-none" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : item ? 'Save Changes' : 'Add Idea'}
        </Button>
      </div>
    </form>
  )
}