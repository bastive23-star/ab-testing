import { supabase } from './supabase'
import { calcTotal } from './scoring'
import type { Category, Restaurant, RestaurantWithStats, Review } from '../types'

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('weight', { ascending: false })
  return data ?? []
}

export async function fetchRestaurantsWithStats(): Promise<RestaurantWithStats[]> {
  const { data } = await supabase
    .from('restaurants_with_stats')
    .select('*')
    .order('avg_score', { ascending: false })
  if (!data) return []
  return data.map((r, i) => ({ ...r, rank: i + 1 }))
}

export async function fetchRestaurant(id: string): Promise<Restaurant | null> {
  const { data } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*, profiles(id, username, avatar_url)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchUserReviews(userId: string): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*, restaurant:restaurants(id, name, cover_photo_url, neighborhood)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function submitReview(
  restaurantId: string,
  userId: string,
  scores: Record<string, number>,
  categories: Category[],
  photos: string[],
  notes: string,
  visitedAt: string
): Promise<void> {
  const total = calcTotal(scores, categories)
  const { error } = await supabase.from('reviews').upsert({
    restaurant_id: restaurantId,
    user_id: userId,
    scores,
    total_score: total,
    photos,
    notes: notes || null,
    visited_at: visitedAt,
  }, { onConflict: 'restaurant_id,user_id' })
  if (error) throw error
}

export async function createRestaurant(data: {
  name: string
  address: string
  neighborhood: string
  lat: number | null
  lng: number | null
  google_maps_url: string | null
  website: string | null
  cover_photo_url: string | null
  created_by: string
}): Promise<Restaurant> {
  const { data: r, error } = await supabase
    .from('restaurants')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return r
}

export async function uploadPhoto(file: File, bucket: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function createCategory(data: {
  name: string
  weight: number
  emoji: string
  created_by: string
}): Promise<Category> {
  const { data: c, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return c
}

export async function updateCategory(id: string, data: { name?: string; weight?: number; emoji?: string }): Promise<void> {
  const { error } = await supabase.from('categories').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
