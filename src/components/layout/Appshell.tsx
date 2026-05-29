import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f7f6f2]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}