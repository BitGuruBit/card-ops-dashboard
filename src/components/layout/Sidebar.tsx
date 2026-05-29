'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, Video, Calculator, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/dashboard',         label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/inventory',         label: 'Inventory',   icon: Package },
  { href: '/content-planner',   label: 'Content',     icon: Video },
  { href: '/profit-calculator', label: 'Profit Calc', icon: Calculator },
]

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-screen bg-white border-r border-black/8 sticky top-0 shrink-0">
        <div className="flex items-center gap-2 px-5 h-14 border-b border-black/8">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-label="Card Ops">
            <rect width="32" height="32" rx="8" fill="#01696f"/>
            <rect x="7" y="9" width="12" height="16" rx="2" fill="white" fillOpacity="0.9"/>
            <rect x="13" y="7" width="12" height="16" rx="2" fill="white" fillOpacity="0.4"/>
            <path d="M10 14h6M10 17h4" stroke="#01696f" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-bold text-[#28251d] tracking-tight">Card Ops</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-[#f0fafa] text-[#01696f]'
                  : 'text-[#7a7974] hover:text-[#28251d] hover:bg-[#f3f0ec]'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-[#7a7974] hover:text-[#28251d] hover:bg-[#f3f0ec] transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-black/8 flex" aria-label="Mobile navigation">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              pathname === href ? 'text-[#01696f]' : 'text-[#7a7974]'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}