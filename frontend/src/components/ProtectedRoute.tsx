import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuth((state) => state.isAuthenticated)
  const isLoading = useAuth((state) => state.isLoading)
  const user = useAuth((state) => state.user)
  const fetchUser = useAuth((state) => state.fetchUser)

  useEffect(() => {
    if (isAuthenticated && !user && !isLoading) {
      fetchUser()
    }
  }, [isAuthenticated, user, isLoading, fetchUser])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

