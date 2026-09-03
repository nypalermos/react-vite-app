import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'

const PAGE_SIZE = 10
const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'Real', label: 'Real' },
  { value: 'Fake', label: 'Fake' },
  { value: 'Both', label: 'Both' },
]

function Events() {
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    })
    if (eventTypeFilter) {
      params.set('event_type', eventTypeFilter)
    }

    try {
      const response = await fetch(`/api/events?${params}`)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setEvents(data.items)
      setTotal(data.total)
    } catch (fetchError) {
      setEvents([])
      setTotal(0)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Unable to reach the API. Is the Python server running?',
      )
    } finally {
      setLoading(false)
    }
  }, [offset, eventTypeFilter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!loading && total > 0 && offset >= total) {
      setOffset(Math.max(0, total - PAGE_SIZE))
    }
  }, [loading, total, offset])

  async function handleDelete(eventId, eventName) {
    const confirmed = window.confirm(
      `Delete "${eventName}"? This cannot be undone.`,
    )
    if (!confirmed) {
      return
    }

    setDeletingId(eventId)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.status === 404) {
        throw new Error('Event not found.')
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      if (events.length === 1 && offset > 0) {
        setOffset(Math.max(0, offset - PAGE_SIZE))
      } else {
        await fetchEvents()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete the event.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleFilterChange(event) {
    setEventTypeFilter(event.target.value)
    setOffset(0)
  }

  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + events.length, total)
  const hasPrevious = offset > 0
  const hasNext = offset + PAGE_SIZE < total

  return (
    <main className="events-page">
      <div className="events-content">
        <div className="events-list-header">
          <h2>Events</h2>
          <Link to="/events/new" className="time-button event-form-link">
            Add event
          </Link>
        </div>

        <div className="events-list-controls">
          <label className="events-filter">
            <span>Filter by type</span>
            <select value={eventTypeFilter} onChange={handleFilterChange}>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && <p>Loading events...</p>}

        {error && <p className="time-error">{error}</p>}

        {!loading && !error && total === 0 && (
          <p>No events yet. Create one to get started.</p>
        )}

        {!loading && !error && total > 0 && (
          <>
            <p className="events-page-summary">
              Showing {pageStart}-{pageEnd} of {total}
            </p>

            <ul className="events-list">
              {events.map((event) => (
                <li key={event.event_id} className="event-card event-list-item">
                  <div className="event-list-item-main">
                    <h3>{event.event_name}</h3>
                    <p>
                      <strong>Type:</strong> {event.event_type}
                    </p>
                  </div>
                  <div className="event-list-item-actions">
                    <Link
                      to={`/events/${event.event_id}/edit`}
                      className="time-button event-form-link"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="time-button event-delete-button"
                      onClick={() => handleDelete(event.event_id, event.event_name)}
                      disabled={deletingId === event.event_id}
                    >
                      {deletingId === event.event_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="events-pagination">
              <button
                type="button"
                className="time-button"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={!hasPrevious || loading}
              >
                Previous
              </button>
              <button
                type="button"
                className="time-button"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={!hasNext || loading}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default Events
