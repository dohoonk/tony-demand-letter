import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, fetchUser } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !useAuth.getState().user) {
      fetchUser()
    }
  }, [isAuthenticated, fetchUser])

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

