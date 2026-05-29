interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-[#01696f] border-[#0c4e54] text-white' : 'bg-white border-black/8 text-[#28251d]'}`}>
      <p className={`text-xs font-medium mb-1 ${accent ? 'text-[#cceeee]' : 'text-[#7a7974]'}`}>{label}</p>
      <p className={`text-2xl font-bold tabular ${accent ? 'text-white' : 'text-[#28251d]'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-[#cceeee]' : 'text-[#7a7974]'}`}>{sub}</p>}
    </div>
  )
}