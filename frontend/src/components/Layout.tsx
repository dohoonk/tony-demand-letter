import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { user, logout, fetchUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1
            onClick={() => navigate('/documents')}
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-gray-700"
          >
            Steno Demand Letter Generator
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.firstName} {user?.lastName}
              <span className="ml-2 text-xs text-gray-500">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

