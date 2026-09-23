import { useMemo, useState } from 'react'
import { AuthContext } from './auth-context.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './token.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken())

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      async login(username, password) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid username or password.')
          }
          throw new Error(`Login failed with status ${response.status}`)
        }

        const data = await response.json()
        setAccessToken(data.access_token)
        setToken(data.access_token)
      },
      logout() {
        clearAccessToken()
        setToken(null)
      },
    }),
    [token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
