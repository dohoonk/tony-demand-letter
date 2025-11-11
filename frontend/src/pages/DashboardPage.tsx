import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-gray-600">
            Your demand letter drafting workspace will be here. Features coming soon:
          </p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>• Upload and manage case PDFs</li>
            <li>• Review and approve extracted facts</li>
            <li>• Create demand letters with AI assistance</li>
            <li>• Collaborate in real-time with your team</li>
            <li>• Export professional DOCX documents</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

