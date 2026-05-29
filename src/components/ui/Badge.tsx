function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

const variants: Record<string, string> = {
  in_stock:   'bg-blue-50 text-blue-700 border-blue-100',
  listed:     'bg-amber-50 text-amber-700 border-amber-100',
  sold:       'bg-green-50 text-green-700 border-green-100',
  NM:         'bg-emerald-50 text-emerald-700 border-emerald-100',
  LP:         'bg-green-50 text-green-700 border-green-100',
  MP:         'bg-yellow-50 text-yellow-700 border-yellow-100',
  HP:         'bg-orange-50 text-orange-700 border-orange-100',
  DMG:        'bg-red-50 text-red-700 border-red-100',
  idea:       'bg-slate-50 text-slate-600 border-slate-100',
  scripting:  'bg-purple-50 text-purple-700 border-purple-100',
  filming:    'bg-orange-50 text-orange-700 border-orange-100',
  editing:    'bg-amber-50 text-amber-700 border-amber-100',
  scheduled:  'bg-blue-50 text-blue-700 border-blue-100',
  published:  'bg-green-50 text-green-700 border-green-100',
  eBay:       'bg-red-50 text-red-600 border-red-100',
  TCGPlayer:  'bg-teal-50 text-teal-600 border-teal-100',
  YouTube:    'bg-red-50 text-red-600 border-red-100',
  TikTok:     'bg-slate-50 text-slate-800 border-slate-100',
  Instagram:  'bg-pink-50 text-pink-600 border-pink-100',
  Twitch:     'bg-purple-50 text-purple-700 border-purple-100',
  Podcast:    'bg-indigo-50 text-indigo-700 border-indigo-100',
  Facebook:   'bg-blue-50 text-blue-700 border-blue-100',
}

export default function Badge({ value }: { value: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', variants[value] ?? 'bg-gray-50 text-gray-600 border-gray-100')}>
      {value.replace('_', ' ')}
    </span>
  )
}