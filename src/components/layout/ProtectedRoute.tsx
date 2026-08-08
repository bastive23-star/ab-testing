import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-4xl animate-bounce">🥖</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <Outlet />
}
