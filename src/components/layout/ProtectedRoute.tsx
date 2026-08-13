import { Navigate, Outlet } from 'react-router-dom'
import { getRole, getName } from '../../lib/auth'

// Accessible to guests and members (read-only pages)
export function GuestRoute() {
  if (getRole() === 'none') return <Navigate to="/auth" replace />
  return <Outlet />
}

// Accessible to members only (write actions)
export function MemberRoute() {
  if (getRole() !== 'member') return <Navigate to="/auth" replace />
  if (!getName()) return <Navigate to="/auth" replace />
  return <Outlet />
}
