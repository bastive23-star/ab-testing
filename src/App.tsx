import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { GuestRoute, MemberRoute } from './components/layout/ProtectedRoute'
import { RankingPage } from './pages/RankingPage'
import { RestaurantPage } from './pages/RestaurantPage'
import { AddRestaurantPage } from './pages/AddRestaurantPage'
import { ReviewPage } from './pages/ReviewPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'
import { EditRestaurantPage } from './pages/EditRestaurantPage'
import { ImpressumPage } from './pages/ImpressumPage'
import { DatenschutzPage } from './pages/DatenschutzPage'

const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Routes>
          {/* Public — no auth required */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />

          {/* Read-only — guest or member */}
          <Route element={<GuestRoute />}>
            <Route element={<Layout />}>
              <Route index element={<RankingPage />} />
              <Route path="map" element={<Suspense fallback={null}><MapPage /></Suspense>} />
              <Route path="restaurant/:id" element={<RestaurantPage />} />
            </Route>
          </Route>

          {/* Write — member only */}
          <Route element={<MemberRoute />}>
            <Route element={<Layout />}>
              <Route path="add" element={<AddRestaurantPage />} />
              <Route path="restaurant/:id/edit" element={<EditRestaurantPage />} />
              <Route path="review/:restaurantId" element={<ReviewPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
