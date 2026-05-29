import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency, calcProfit, formatDate } from '@/lib/utils'
import { CheckSquare, Square } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: inventory }, { data: tasks }] = await Promise.all([
    supabase.from('inventory').select('*').eq('user_id', user!.id),
    supabase.from('tasks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
  ])

  const inv = inventory ?? []
  const soldItems = inv.filter(i => i.status === 'sold')
  const totalRevenue = soldItems.reduce((s: number, i: any) => s + (i.sold_price ?? 0), 0)
  const estProfit = soldItems.reduce((s: number, i: any) => s + calcProfit(i.cost, i.sold_price), 0)
  const pendingTasks = (tasks ?? []).filter((t: any) => !t.completed).length

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Dashboard</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">Your store at a glance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Inventory" value={inv.filter((i: any) => i.status !== 'sold').reduce((s: number, i: any) => s + i.quantity, 0)} sub={`${inv.filter((i: any) => i.status === 'listed').length} listed`} />
          <StatCard label="Items Sold" value={soldItems.length} sub={`${formatCurrency(totalRevenue)} revenue`} />
          <StatCard label="Est. Profit" value={formatCurrency(estProfit)} sub="after ~13% fees" accent />
          <StatCard label="Pending Tasks" value={pendingTasks} sub={`${(tasks ?? []).length} total`} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Recent Sales</h2>
            {soldItems.length === 0 ? (
              <p className="text-sm text-[#7a7974] py-4 text-center">No sales yet. List some cards!</p>
            ) : (
              <div className="space-y-2">
                {soldItems.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#28251d]">{item.card_name}</p>
                      <p className="text-xs text-[#7a7974]">{item.platform} · {item.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular text-green-600">{formatCurrency(item.sold_price)}</p>
                      <p className="text-xs text-[#7a7974] tabular">cost {formatCurrency(item.cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Tasks</h2>
            {(tasks ?? []).length === 0 ? (
              <p className="text-sm text-[#7a7974] py-4 text-center">No tasks yet!</p>
            ) : (
              <div className="space-y-1">
                {(tasks ?? []).slice(0, 6).map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 py-2 border-b border-black/5 last:border-0">
                    {task.completed
                      ? <CheckSquare size={16} className="text-[#01696f] shrink-0 mt-0.5" />
                      : <Square size={16} className="text-[#bab9b4] shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.completed ? 'line-through text-[#bab9b4]' : 'text-[#28251d]'}`}>{task.title}</p>
                      {task.due_date && <p className="text-xs text-[#7a7974]">Due {formatDate(task.due_date)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}