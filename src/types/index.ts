export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'
export type InventoryStatus = 'in_stock' | 'listed' | 'sold'
export type SellPlatform = 'eBay' | 'TCGPlayer' | 'Facebook' | 'Local' | 'Other'
export type ContentPlatform = 'YouTube' | 'TikTok' | 'Instagram' | 'Twitch' | 'Podcast' | 'Other'
export type ContentStatus = 'idea' | 'scripting' | 'filming' | 'editing' | 'scheduled' | 'published'

export interface InventoryItem {
  id: string
  user_id: string
  card_name: string
  set_name: string | null
  condition: Condition
  quantity: number
  cost: number
  listed_price: number | null
  sold_price: number | null
  platform: SellPlatform | null
  status: InventoryStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ContentIdea {
  id: string
  user_id: string
  title: string
  platform: ContentPlatform | null
  status: ContentStatus
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  completed: boolean
  due_date: string | null
  created_at: string
}