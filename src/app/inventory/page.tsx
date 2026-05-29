import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import InventoryTable from '@/components/inventory/InventoryTable'

export default async function InventoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="px-6 py-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#28251d]">Inventory</h1>
          <p className="text-sm text-[#7a7974] mt-0.5">Track every card — in stock, listed, and sold</p>
        </div>
        <InventoryTable items={items ?? []} userId={user!.id} />
      </div>
    </AppShell>
  )
}