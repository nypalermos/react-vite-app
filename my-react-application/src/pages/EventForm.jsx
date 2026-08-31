import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

const EVENT_TYPES = ['Real', 'Fake', 'Both']

const emptyIncident = () => ({ username: '', comment: '' })

function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventType, setEventType] = useState('Real')
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    if (!isEdit) {
      return
    }

    async function loadEvent() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/events/${id}`)

        if (response.status === 404) {
          setError('Event not found.')
          return
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()
        setEventName(data.event_name)
        setEventDescription(data.event_description)
        setEventType(data.event_type)
        setIncidents(data.incidents ?? [])
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to reach the API. Is the Python server running?',
        )
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id, isEdit])

  function addIncident() {
    setIncidents((current) => [...current, emptyIncident()])
  }

  function removeIncident(index) {
    setIncidents((current) => current.filter((_, i) => i !== index))
  }

  function updateIncident(index, field, value) {
    setIncidents((current) =>
      current.map((incident, i) =>
        i === index ? { ...incident, [field]: value } : incident,
      ),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setValidationError(null)
    setError(null)

    const trimmedName = eventName.trim()
    const trimmedDescription = eventDescription.trim()

    if (!trimmedName || !trimmedDescription) {
      setValidationError('Event name and description are required.')
      return
    }

    const payload = {
      event_name: trimmedName,
      event_description: trimmedDescription,
      event_type: eventType,
      incidents,
    }

    setSubmitting(true)

    try {
      const url = isEdit ? `/api/events/${id}` : '/api/events'
      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      navigate('/events')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the event.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="events-page">
        <div className="events-content">
          <h2>{isEdit ? 'Edit event' : 'Add event'}</h2>
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (isEdit && error && !eventName) {
    return (
      <main className="events-page">
        <div className="events-content">
          <h2>Edit event</h2>
          <p className="time-error">{error}</p>
          <Link to="/events" className="time-button event-form-link">
            Back to events
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="events-page">
      <div className="events-content event-form-content">
        <h2>{isEdit ? 'Edit event' : 'Add event'}</h2>

        <form className="event-form" onSubmit={handleSubmit}>
          <label className="event-form-field">
            <span>Event name</span>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              disabled={submitting}
            />
          </label>

          <label className="event-form-field">
            <span>Description</span>
            <textarea
              rows={4}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              disabled={submitting}
            />
          </label>

          <label className="event-form-field">
            <span>Event type</span>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              disabled={submitting}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="event-form-incidents">
            <legend>Incidents</legend>

            {incidents.length === 0 ? (
              <p className="event-form-empty">No incidents added yet.</p>
            ) : (
              <ul className="incident-form-list">
                {incidents.map((incident, index) => (
                  <li key={`incident-${index}`} className="incident-form-row">
                    <label className="event-form-field">
                      <span>Username</span>
                      <input
                        type="text"
                        value={incident.username}
                        onChange={(e) =>
                          updateIncident(index, 'username', e.target.value)
                        }
                        disabled={submitting}
                      />
                    </label>
                    <label className="event-form-field">
                      <span>Comment</span>
                      <input
                        type="text"
                        value={incident.comment}
                        onChange={(e) =>
                          updateIncident(index, 'comment', e.target.value)
                        }
                        disabled={submitting}
                      />
                    </label>
                    <button
                      type="button"
                      className="time-button incident-remove-button"
                      onClick={() => removeIncident(index)}
                      disabled={submitting}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="time-button"
              onClick={addIncident}
              disabled={submitting}
            >
              Add incident
            </button>
          </fieldset>

          {validationError && (
            <p className="time-error">{validationError}</p>
          )}
          {error && <p className="time-error">{error}</p>}

          <div className="event-form-actions">
            <button
              type="submit"
              className="time-button"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create event'}
            </button>
            <Link to="/events" className="time-button event-form-link">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

export default EventForm
