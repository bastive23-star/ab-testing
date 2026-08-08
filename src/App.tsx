import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { RankingPage } from './pages/RankingPage'
import { RestaurantPage } from './pages/RestaurantPage'
import { AddRestaurantPage } from './pages/AddRestaurantPage'
import { ReviewPage } from './pages/ReviewPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { AuthPage } from './pages/AuthPage'
import { ProfilePage } from './pages/ProfilePage'

const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route index element={<RankingPage />} />
            <Route path="map" element={<Suspense fallback={null}><MapPage /></Suspense>} />
            <Route path="add" element={<AddRestaurantPage />} />
            <Route path="restaurant/:id" element={<RestaurantPage />} />
            <Route path="review/:restaurantId" element={<ReviewPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
