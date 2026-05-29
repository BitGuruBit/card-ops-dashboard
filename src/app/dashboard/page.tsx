import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency, calcProfit, formatDate } from '@/lib/utils'
import { CheckSquare, Square, TrendingUp, TrendingDown } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: inventory }, { data: tasks }] = await Promise.all([
    supabase.from('inventory').select('*').eq('user_id', user!.id),
    supabase.from('tasks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
  ])

  const inv = inventory ?? []
  const soldItems = inv.filter((i: any) => i.status === 'sold')
  const activeItems = inv.filter((i: any) => i.status !== 'sold')
  const totalRevenue = soldItems.reduce((s: number, i: any) => s + (i.sold_price ?? 0), 0)
  const totalCost = soldItems.reduce((s: number, i: any) => s + (i.cost ?? 0), 0)
  const estProfit = soldItems.reduce((s: number, i: any) => s + calcProfit(i.cost, i.sold_price), 0)
  const inventoryValue = activeItems.reduce((s: number, i: any) => s + ((i.listed_price ?? i.cost ?? 0) * (i.quantity ?? 1)), 0)
  const roi = totalCost > 0 ? ((estProfit / totalCost) * 100).toFixed(1) : '0.0'
  const pendingTasks = (tasks ?? []).filter((t: any) => !t.completed).length

  const games = ['Pokemon', 'MTG', 'Yu-Gi-Oh']
  const gameBreakdown = games.map(game => ({
    game,
    count: inv.filter((i: any) => i.game === game).length,
    value: inv
      .filter((i: any) => i.game === game)
      .reduce((s: number, i: any) => s + ((i.listed_price ?? i.cost ?? 0) * (i.quantity ?? 1)), 0),
  }))

  const topCards = [...activeItems]
    .sort((a: any, b: any) => (b.listed_price ?? 0) - (a.listed_price ?? 0))
    .slice(0, 5)

  const now = new Date()
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (5 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    const label = `W${i + 1}`
    const profit = soldItems
      .filter((item: any) => {
        const d = new Date(item.updated_at)
        return d >= weekStart && d < weekEnd
      })
      .reduce((s: number, item: any) => s + calcProfit(item.cost, item.sold_price), 0)
    return { label, profit }
  })
  const maxProfit = Math.max(...weeks.map(w => w.profit), 1)

  const gameColors: Record<string, string> = {
    Pokemon: '#01696f',
    MTG: '#964219',
    'Yu-Gi-Oh': '#d19900',
  }

  return (
    <AppShell>
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Dashboard</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">Your store at a glance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <StatCard
            label="Total Inventory"
            value={activeItems.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0)}
            sub={`${inv.filter((i: any) => i.status === 'listed').length} listed`}
          />
          <StatCard
            label="Inventory Value"
            value={formatCurrency(inventoryValue)}
            sub="at listed price"
          />
          <StatCard
            label="Items Sold"
            value={soldItems.length}
            sub={`${formatCurrency(totalRevenue)} revenue`}
          />
          <StatCard
            label="Est. Profit"
            value={formatCurrency(estProfit)}
            sub="after ~13% fees"
            accent
          />
          <StatCard
            label="ROI"
            value={`${roi}%`}
            sub="return on cost"
          />
          <StatCard
            label="Pending Tasks"
            value={pendingTasks}
            sub={`${(tasks ?? []).length} total`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Profit Trend */}
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Profit Trend (Last 6 Weeks)</h2>
            {weeks.every(w => w.profit === 0) ? (
              <p className="text-sm text-[#7a7974] py-8 text-center">No sales data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {weeks.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[#7a7974] tabular-nums">
                      {week.profit > 0 ? formatCurrency(week.profit) : ''}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-[#01696f] transition-all"
                      style={{
                        height: `${Math.max((week.profit / maxProfit) * 96, week.profit > 0 ? 8 : 2)}px`,
                        opacity: week.profit > 0 ? 1 : 0.15,
                      }}
                    />
                    <span className="text-xs text-[#7a7974]">{week.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Game Breakdown */}
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Inventory by Game</h2>
            {inv.length === 0 ? (
              <p className="text-sm text-[#7a7974] py-8 text-center">No inventory yet</p>
            ) : (
              <div className="space-y-3">
                {gameBreakdown.map(({ game, count, value }) => {
                  const pct = inv.length > 0 ? (count / inv.length) * 100 : 0
                  return (
                    <div key={game}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-[#28251d]">{game}</span>
                        <span className="text-[#7a7974]">{count} cards · {formatCurrency(value)}</span>
                      </div>
                      <div className="h-2 bg-[#f3f0ec] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: gameColors[game] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Recent Sales */}
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Recent Sales</h2>
            {soldItems.length === 0 ? (
              <p className="text-sm text-[#7a7974] py-4 text-center">No sales yet. List some cards!</p>
            ) : (
              <div className="space-y-2">
                {soldItems.slice(0, 5).map((item: any) => {
                  const profit = calcProfit(item.cost, item.sold_price)
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#28251d]">{item.card_name}</p>
                        <p className="text-xs text-[#7a7974]">{item.platform} · {item.condition}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-green-600">{formatCurrency(item.sold_price)}</p>
                        <div className="flex items-center justify-end gap-0.5">
                          {profit >= 0
                            ? <TrendingUp size={10} className="text-green-500" />
                            : <TrendingDown size={10} className="text-red-500" />
                          }
                          <p className={`text-xs tabular-nums ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Cards by Value */}
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Top Cards by Value</h2>
            {topCards.length === 0 ? (
              <p className="text-sm text-[#7a7974] py-4 text-center">No active inventory</p>
            ) : (
              <div className="space-y-2">
                {topCards.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                    <span className="text-xs font-bold text-[#bab9b4] w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#28251d] truncate">{item.card_name}</p>
                      <p className="text-xs text-[#7a7974]">{item.game} · {item.condition}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-[#28251d]">
                      {formatCurrency(item.listed_price ?? item.cost ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-black/8 p-5">
            <h2 className="text-sm font-semibold text-[#28251d] mb-4">Recent Tasks</h2>
            {(tasks ?? []).length === 0 ? (
              <p className="text-sm text-[#7a7974] py-4 text-center">No tasks yet</p>
            ) : (
              <div>
                {(tasks ?? []).slice(0, 6).map((task: any) => (
                  <div key={task.id} className="flex items-start gap-3 py-2 border-b border-black/5 last:border-0">
                    {task.completed
                      ? <CheckSquare size={16} className="text-[#01696f] shrink-0 mt-0.5" />
                      : <Square size={16} className="text-[#bab9b4] shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.completed ? 'line-through text-[#bab9b4]' : 'text-[#28251d]'}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-[#7a7974]">Due {formatDate(task.due_date)}</p>
                      )}
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