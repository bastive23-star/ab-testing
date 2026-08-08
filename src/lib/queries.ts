import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, setDoc, runTransaction,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import { calcTotal } from './scoring'
import type { Category, Restaurant, RestaurantWithStats, Review, Profile } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function toCategory(id: string, d: Record<string, unknown>): Category {
  return { id, name: d.name as string, weight: d.weight as number, emoji: d.emoji as string, created_by: (d.createdBy as string) ?? null, created_at: (d.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? '' }
}
function toRestaurant(id: string, d: Record<string, unknown>): Restaurant {
  return {
    id, name: d.name as string, address: d.address as string,
    neighborhood: (d.neighborhood as string) ?? '',
    lat: (d.lat as number) ?? null, lng: (d.lng as number) ?? null,
    google_maps_url: (d.googleMapsUrl as string) ?? null,
    website: (d.website as string) ?? null,
    cover_photo_url: (d.coverPhotoUrl as string) ?? null,
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

export async function createCategory(data: { name: string; weight: number; emoji: string; created_by: string }): Promise<Category> {
  const ref = await addDoc(collection(db, 'categories'), {
    name: data.name, weight: data.weight, emoji: data.emoji,
    createdBy: data.created_by, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data, created_at: new Date().toISOString() }
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
  name: string; address: string; neighborhood: string;
  lat: number | null; lng: number | null;
  google_maps_url: string | null; website: string | null;
  cover_photo_url: string | null; created_by: string;
}): Promise<Restaurant> {
  const ref = await addDoc(collection(db, 'restaurants'), {
    name: data.name, address: data.address, neighborhood: data.neighborhood,
    lat: data.lat, lng: data.lng,
    googleMapsUrl: data.google_maps_url, website: data.website,
    coverPhotoUrl: data.cover_photo_url, createdBy: data.created_by,
    avgScore: 0, reviewCount: 0, createdAt: serverTimestamp(),
  })
  return { id: ref.id, ...data, avg_score: 0, review_count: 0, created_at: new Date().toISOString() }
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId), orderBy('createdAt', 'desc'))
  )
  const reviews = snap.docs.map(d => toReview(d.id, d.data() as Record<string, unknown>))

  // Attach profiles
  const uids = [...new Set(reviews.map(r => r.user_id))]
  const profiles = await Promise.all(uids.map(async uid => {
    const p = await getDoc(doc(db, 'profiles', uid))
    return p.exists() ? { id: uid, ...(p.data() as Record<string, unknown>) } : null
  }))
  const profileMap = Object.fromEntries(profiles.filter(Boolean).map(p => [p!.id, p as Record<string, unknown>]))

  return reviews.map(r => ({
    ...r,
    profiles: profileMap[r.user_id]
      ? { id: r.user_id, username: profileMap[r.user_id].username as string, avatar_url: (profileMap[r.user_id].avatarUrl as string) ?? null, created_at: '' }
      : undefined,
  }))
}

export async function fetchUserReviews(userId: string): Promise<Review[]> {
  const snap = await getDocs(
    query(collection(db, 'reviews'), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  )
  const reviews = snap.docs.map(d => toReview(d.id, d.data() as Record<string, unknown>))

  // Attach restaurant info
  const rids = [...new Set(reviews.map(r => r.restaurant_id))]
  const rests = await Promise.all(rids.map(async id => {
    const r = await getDoc(doc(db, 'restaurants', id))
    return r.exists() ? { id, ...(r.data() as Record<string, unknown>) } : null
  }))
  const restMap = Object.fromEntries(rests.filter(Boolean).map(r => [r!.id, r as Record<string, unknown>]))

  return reviews.map(r => ({
    ...r,
    restaurant: restMap[r.restaurant_id]
      ? { id: r.restaurant_id, name: restMap[r.restaurant_id].name as string, cover_photo_url: (restMap[r.restaurant_id].coverPhotoUrl as string) ?? null, neighborhood: (restMap[r.restaurant_id].neighborhood as string) ?? '', address: '', lat: null, lng: null, google_maps_url: null, website: null, created_by: '', created_at: '' }
      : undefined,
  }))
}

export async function submitReview(
  restaurantId: string, userId: string,
  scores: Record<string, number>, categories: Category[],
  photos: string[], notes: string, visitedAt: string,
): Promise<void> {
  const total = calcTotal(scores, categories)

  // Upsert review (one per user per restaurant)
  const existing = await getDocs(
    query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId), where('userId', '==', userId))
  )

  const reviewData = { restaurantId, userId, scores, totalScore: total, photos, notes: notes || null, visitedAt, createdAt: serverTimestamp() }

  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, reviewData)
  } else {
    await addDoc(collection(db, 'reviews'), reviewData)
  }

  // Recalculate restaurant stats
  await runTransaction(db, async tx => {
    const allReviews = await getDocs(
      query(collection(db, 'reviews'), where('restaurantId', '==', restaurantId))
    )
    const scores_list = allReviews.docs.map(d => (d.data() as { totalScore: number }).totalScore)
    const avg = scores_list.length ? scores_list.reduce((a, b) => a + b, 0) / scores_list.length : 0
    tx.update(doc(db, 'restaurants', restaurantId), {
      avgScore: Math.round(avg * 100) / 100,
      reviewCount: scores_list.length,
    })
  })
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function upsertProfile(uid: string, username: string): Promise<void> {
  await setDoc(doc(db, 'profiles', uid), { username, createdAt: serverTimestamp() }, { merge: true })
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function uploadPhoto(file: File, bucket: string): Promise<string> {
  const path = `${bucket}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
