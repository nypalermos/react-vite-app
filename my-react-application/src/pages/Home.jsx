import { useEffect, useState } from 'react'

async function requestCurrentTime() {
  const response = await fetch('/api/time')

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data.time
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Unable to reach the API. Is the Python server running?'
}

/** Render the landing page controls and server-time status. */
function Home() {
  const [currentTime, setCurrentTime] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) {
      return undefined
    }

    let ignore = false

    /** Fetch the current server time when automatic refresh is enabled. */
    async function fetchCurrentTime() {
      try {
        const time = await requestCurrentTime()
        if (!ignore) {
          setCurrentTime(time)
          setError(null)
        }
      } catch (fetchError) {
        if (!ignore) {
          setCurrentTime(null)
          setError(getErrorMessage(fetchError))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchCurrentTime()

    return () => {
      ignore = true
    }
  }, [autoRefresh])

  /** Fetch the current server time after a manual request. */
  async function fetchCurrentTime() {
    setLoading(true)
    setError(null)

    try {
      setCurrentTime(await requestCurrentTime())
    } catch (fetchError) {
      setCurrentTime(null)
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  function toggleAutoRefresh() {
    const nextAutoRefresh = !autoRefresh
    setAutoRefresh(nextAutoRefresh)
    setLoading(nextAutoRefresh)
    if (nextAutoRefresh) {
      setError(null)
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
        <button
          type="button"
          className="time-button"
          onClick={toggleAutoRefresh}
        >
          Auto refresh: {autoRefresh ? 'on' : 'off'}
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
