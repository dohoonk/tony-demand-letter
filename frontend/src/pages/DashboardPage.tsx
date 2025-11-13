import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { fetchUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
    // Redirect to documents page
    navigate('/documents')
  }, [fetchUser, navigate])

  return null
}

