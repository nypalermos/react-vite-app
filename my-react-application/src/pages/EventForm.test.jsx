import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventForm from './EventForm.jsx'
import { renderWithEventRoutes } from '../test/test-utils.jsx'

const navigate = vi.fn()

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('EventForm', () => {
  beforeEach(() => {
    navigate.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the create form', () => {
    renderWithEventRoutes(<EventForm />, { route: '/events/new' })

    expect(screen.getByRole('heading', { name: 'Add event' })).toBeInTheDocument()
    expect(screen.getByLabelText('Event name')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Event type')).toBeInTheDocument()
  })

  it('requires name and description before submit', async () => {
    const user = userEvent.setup()
    renderWithEventRoutes(<EventForm />, { route: '/events/new' })

    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(
      screen.getByText('Event name and description are required.'),
    ).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('adds and removes incident rows', async () => {
    const user = userEvent.setup()
    renderWithEventRoutes(<EventForm />, { route: '/events/new' })

    await user.click(screen.getByRole('button', { name: 'Add incident' }))

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Comment')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.getByText('No incidents added yet.')).toBeInTheDocument()
  })

  it('creates an event and navigates back to the list', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        event_id: 2,
        event_name: 'Created Event',
        event_description: 'Created from the form.',
        event_type: 'Real',
        incidents: [],
      }),
    })

    renderWithEventRoutes(<EventForm />, { route: '/events/new' })

    await user.type(screen.getByLabelText('Event name'), 'Created Event')
    await user.type(
      screen.getByLabelText('Description'),
      'Created from the form.',
    )
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'Created Event',
          event_description: 'Created from the form.',
          event_type: 'Real',
          incidents: [],
        }),
      })
    })

    expect(navigate).toHaveBeenCalledWith('/events')
  })

  it('loads an existing event in edit mode', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        event_id: 1,
        event_name: 'Quarterly Security Review',
        event_description: 'Review of reported activity during Q2.',
        event_type: 'Both',
        incidents: [
          {
            username: 'jsmith',
            comment: 'Unusual login pattern detected.',
          },
        ],
      }),
    })

    renderWithEventRoutes(<EventForm />, { route: '/events/1/edit' })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Quarterly Security Review')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Review of reported activity during Q2.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jsmith')).toBeInTheDocument()
  })

  it('shows a not-found message when edit load fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    renderWithEventRoutes(<EventForm />, { route: '/events/99/edit' })

    await waitFor(() => {
      expect(screen.getByText('Event not found.')).toBeInTheDocument()
    })
  })
})
