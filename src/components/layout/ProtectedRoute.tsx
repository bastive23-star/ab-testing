import { Navigate, Outlet } from 'react-router-dom'
import { isUnlocked, getName } from '../../lib/auth'

export function ProtectedRoute() {
  if (!isUnlocked()) return <Navigate to="/auth" replace />
  if (!getName()) return <Navigate to="/auth" replace />
  return <Outlet />
}
