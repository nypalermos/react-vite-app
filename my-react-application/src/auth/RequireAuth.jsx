import { Navigate } from 'react-router'
import { useAuth } from './useAuth.js'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireAuth
