import { useEffect, useState } from 'react'
import { Link } from 'react-router'

function Events() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/events')

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        setEvents(data)
      } catch (fetchError) {
        setEvents([])
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to reach the API. Is the Python server running?',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <main className="events-page">
      <div className="events-content">
        <div className="events-list-header">
          <h2>Events</h2>
          <Link to="/events/new" className="time-button event-form-link">
            Add event
          </Link>
        </div>

        {loading && <p>Loading events...</p>}

        {error && <p className="time-error">{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>No events yet. Create one to get started.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <ul className="events-list">
            {events.map((event) => (
              <li key={event.event_id} className="event-card event-list-item">
                <div className="event-list-item-main">
                  <h3>{event.event_name}</h3>
                  <p>
                    <strong>Type:</strong> {event.event_type}
                  </p>
                </div>
                <Link
                  to={`/events/${event.event_id}/edit`}
                  className="time-button event-form-link"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

export default Events
