import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import { calcTotal } from './scoring'
import type { Category, Profile, Restaurant, RestaurantWithStats, Review } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function toCategory(id: string, d: Record<string, unknown>): Category {
  return { id, name: d.name as string, weight: d.weight as number, emoji: d.emoji as string, food_type: (d.foodType as string) ?? null, created_by: (d.createdBy as string) ?? null, created_at: (d.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? '' }
}
function toRestaurant(id: string, d: Record<string, unknown>): Restaurant {
  return {
    id, name: d.name as string,
    food_type: (d.foodType as string) ?? 'Bánh Mì',
    address: d.address as string,
    neighborhood: (d.neighborhood as string) ?? '',
    lat: (d.lat as number) ?? null, lng: (d.lng as number) ?? null,
    google_maps_url: (d.googleMapsUrl as string) ?? null,
    website: (d.website as string) ?? null,
    cover_photo_url: (d.coverPhotoUrl as string) ?? null,
    has_seitan: (d.hasSeitan as boolean) ?? false,
    created_by: d.createdBy as string,
    created_at: (d.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? '',
    avg_score: (d.avgScore as number) ?? 0,
    review_count: (d.reviewCount as number) ?? 0,
  }
}
function toReview(id: string, d: Record<string, unknown>): Review {
  return {
    id, restaurant_id: d.restaurantId as string, user_id: d.userId as string,
    scores: (d.scores as Record<string, number>) ?? {},
    total_score: d.totalScore as number,
    photos: (d.photos as string[]) ?? [],
    notes: (d.notes as string) ?? null,
    visited_at: d.visitedAt as string,
    created_at: (d.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? '',
    profiles: d.profile as Profile | undefined,
  }
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('weight', 'desc')))
  return snap.docs.map(d => toCategory(d.id, d.data() as Record<string, unknown>))
}

export async function createCategory(data: { name: string; weight: number; emoji: string; food_type?: string | null; created_by: string }): Promise<Category> {
  const ref = await addDoc(collection(db, 'categories'), {
    name: data.name, weight: data.weight, emoji: data.emoji,
    foodType: data.food_type ?? null,
    createdBy: data.created_by, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data, food_type: data.food_type ?? null, created_at: new Date().toISOString() }
}

export async function updateCategory(id: string, data: { name?: string; weight?: number; emoji?: string }): Promise<void> {
  await updateDoc(doc(db, 'categories', id), data)
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id))
}

// ── Restaurants ───────────────────────────────────────────────────────────────

export async function fetchRestaurantsWithStats(): Promise<RestaurantWithStats[]> {
  const snap = await getDocs(query(collection(db, 'restaurants'), orderBy('avgScore', 'desc')))
  return snap.docs
    .map(d => toRestaurant(d.id, d.data() as Record<string, unknown>) as RestaurantWithStats)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}

export async function fetchRestaurant(id: string): Promise<Restaurant | null> {
  const snap = await getDoc(doc(db, 'restaurants', id))
  if (!snap.exists()) return null
  return toRestaurant(snap.id, snap.data() as Record<string, unknown>)
}

export async function createRestaurant(data: {
  name: string; food_type: string; address: string; neighborhood: string;
  lat: number | null; lng: number | null;
  google_maps_url: string | null; website: string | null;
  cover_photo_url: string | null; created_by: string;
}): Promise<Restaurant> {
  const ref = await addDoc(collection(db, 'restaurants'), {
    name: data.name, foodType: data.food_type, address: data.address, neighborhood: data.neighborhood,
    lat: data.lat, lng: data.lng,
    googleMapsUrl: data.google_maps_url, website: data.website,
    coverPhotoUrl: data.cover_photo_url, createdBy: data.created_by,
    avgScore: 0, reviewCount: 0, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data, has_seitan: false, avg_score: 0, review_count: 0, created_at: new Date().toISOString() }
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId))
  )
  return snap.docs
    .map(d => toReview(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function toggleSeitan(restaurantId: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, 'restaurants', restaurantId), { hasSeitan: value })
}

export async function fetchMyReview(restaurantId: string, userName: string): Promise<Review | null> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId), where('userId', '==', userName))
  )
  if (snap.empty) return null
  return toReview(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>)
}

export async function fetchAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'reviews'))
  return snap.docs
    .map(d => toReview(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function fetchUserReviews(userName: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('userId', '==', userName))
  )
  const reviews = snap.docs.map(d => toReview(d.id, d.data() as Record<string, unknown>))
  const rids = [...new Set(reviews.map(r => r.restaurant_id))]
  const rests = await Promise.all(rids.map(async id => {
    const r = await getDoc(doc(db, 'restaurants', id))
    return r.exists() ? { id, ...(r.data() as Record<string, unknown>) } : null
  }))
  const restMap = Object.fromEntries(rests.filter(Boolean).map(r => [r!.id, r as Record<string, unknown>]))
  return reviews.map(r => ({
    ...r,
    restaurant: restMap[r.restaurant_id]
      ? { id: r.restaurant_id, name: restMap[r.restaurant_id].name as string, food_type: (restMap[r.restaurant_id].foodType as string) ?? 'Bánh Mì', cover_photo_url: null, neighborhood: (restMap[r.restaurant_id].neighborhood as string) ?? '', address: '', lat: null, lng: null, google_maps_url: null, website: null, created_by: '', created_at: '' }
      : undefined,
  }))
}

export async function submitReview(
  restaurantId: string, userName: string,
  scores: Record<string, number>, categories: Category[],
  notes: string, visitedAt: string,
): Promise<void> {
  const total = calcTotal(scores, categories)
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId), where('userId', '==', userName))
  )
  const reviewData = { restaurantId, userId: userName, scores, totalScore: total, notes: notes || null, visitedAt, createdAt: serverTimestamp() }
  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, reviewData)
  } else {
    await addDoc(collection(db, 'reviews'), reviewData)
  }
  await runTransaction(db, async tx => {
    const allReviews = await getDocs(query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId)))
    const list = allReviews.docs.map(d => (d.data() as { totalScore: number }).totalScore)
    const avg = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
    tx.update(doc(db, 'restaurants', restaurantId), { avgScore: Math.round(avg * 100) / 100, reviewCount: list.length })
  })
}
