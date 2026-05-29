import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import ContentTable from '@/components/content/ContentTable'

export default async function ContentPlannerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('content_ideas')
    .select('*')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true })

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Content Planner</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">YouTube, TikTok, Instagram & more — all in one place</p>
        </div>
        <ContentTable items={items ?? []} userId={user!.id} />
      </div>
    </AppShell>
  )
}