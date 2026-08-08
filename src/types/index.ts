export interface Category {
  id: string
  name: string
  weight: number
  emoji: string
  created_by: string | null
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  address: string
  neighborhood: string
  lat: number | null
  lng: number | null
  google_maps_url: string | null
  website: string | null
  cover_photo_url: string | null
  created_by: string
  created_at: string
  avg_score?: number
  review_count?: number
  rank?: number
}

export interface Review {
  id: string
  restaurant_id: string
  user_id: string
  scores: Record<string, number>
  total_score: number
  photos: string[]
  notes: string | null
  visited_at: string
  created_at: string
  profiles?: Profile
  restaurant?: Restaurant
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface RestaurantWithStats extends Restaurant {
  avg_score: number
  review_count: number
  rank: number
}
