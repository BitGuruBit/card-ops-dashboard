'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { ContentIdea } from '@/types'

const PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'Twitch', 'Podcast', 'Other']
const STATUSES  = ['idea', 'scripting', 'filming', 'editing', 'scheduled', 'published']

interface Props {
  userId: string
  item?: ContentIdea
  onSuccess: () => void
}

export default function ContentForm({ userId, item, onSuccess }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title:    item?.title    ?? '',
    platform: item?.platform ?? '',
    status:   item?.status   ?? 'idea',
    due_date: item?.due_date ?? '',
    notes:    item?.notes    ?? '',
  })

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const payload = {
      user_id:  userId,
      title:    form.title,
      platform: form.platform || null,
      status:   form.status,
      due_date: form.due_date || null,
      notes:    form.notes || null,
    }
    const { error } = item
      ? await supabase.from('content_ideas').update(payload).eq('id', item.id)
      : await supabase.from('content_ideas').insert(payload)
    if (error) { setError(error.message); setLoading(false) }
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title *" value={form.title} onChange={update('title')} required placeholder="e.g. Pack Opening — Evolving Skies" />
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
      <Input label="Due Date" type="date" value={form.due_date} onChange={update('due_date')} />
      <div>
        <label className="block text-sm font-medium text-[#28251d] mb-1.5">Notes</label>
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