import { useState } from 'react'

function Home() {
  const [currentTime, setCurrentTime] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function fetchCurrentTime() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/time')

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setCurrentTime(data.time)
    } catch (fetchError) {
      setCurrentTime(null)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Unable to reach the API. Is the Python server running?',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="landing">
      <div className="landing-content">
        <p>Welcome. Use About in the upper right to learn more about this app.</p>
        <button
          type="button"
          className="time-button"
          onClick={fetchCurrentTime}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get current time from API'}
        </button>
        {currentTime && (
          <p className="time-result">
            Server time: <code>{currentTime}</code>
          </p>
        )}
        {error && <p className="time-error">{error}</p>}
      </div>
    </main>
  )
}

export default Home
