'use client'
import { useState } from 'react'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import type { ContentIdea } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import ContentForm from './ContentForm'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ContentTable({ items, userId }: { items: ContentIdea[], userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<ContentIdea | null>(null)

  const filtered = items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  async function deleteItem(id: string) {
    if (!confirm('Delete this idea?')) return
    await supabase.from('content_ideas').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bab9b4]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-black/12 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#01696f]/40">
          <option value="all">All Status</option>
          {['idea','scripting','filming','editing','scheduled','published'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <Button onClick={() => setAddOpen(true)}><Plus size={14} /> Add Idea</Button>
      </div>

      <div className="bg-white rounded-xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-[#f9f8f5]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden sm:table-cell">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide hidden md:table-cell">Due Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-[#7a7974]">No ideas yet. Add your first content idea!</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-[#f9f8f5] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#28251d] max-w-xs truncate">{item.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{item.platform ? <Badge value={item.platform} /> : '—'}</td>
                  <td className="px-4 py-3"><Badge value={item.status} /></td>
                  <td className="px-4 py-3 text-[#7a7974] hidden md:table-cell tabular">{formatDate(item.due_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditItem(item)} className="p-1.5 rounded hover:bg-[#f3f0ec] text-[#7a7974] hover:text-[#28251d] transition-colors" aria-label="Edit"><Pencil size={13} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded hover:bg-red-50 text-[#7a7974] hover:text-red-600 transition-colors" aria-label="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-black/5 bg-[#f9f8f5]">
          <p className="text-xs text-[#7a7974]">{filtered.length} of {items.length} ideas</p>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Content Idea">
        <ContentForm userId={userId} onSuccess={() => { setAddOpen(false); router.refresh() }} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Content Idea">
        {editItem && <ContentForm userId={userId} item={editItem} onSuccess={() => { setEditItem(null); router.refresh() }} />}
      </Modal>
    </>
  )
}