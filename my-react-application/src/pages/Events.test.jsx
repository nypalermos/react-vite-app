import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Events from './Events.jsx'
import { renderWithRouter } from '../test/test-utils.jsx'

const paginatedResponse = (items, total = items.length, offset = 0) => ({
  items,
  total,
  limit: 10,
  offset,
})

describe('Events', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders events returned by the API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        paginatedResponse([
          {
            event_id: 1,
            event_name: 'Quarterly Security Review',
            event_type: 'Both',
          },
        ]),
    })

    renderWithRouter(<Events />)

    expect(screen.getByText('Loading events...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Quarterly Security Review')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/events/1/edit',
    )
    expect(screen.getByText('Showing 1-1 of 1')).toBeInTheDocument()
  })

  it('shows an empty state when there are no events', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse([]),
    })

    renderWithRouter(<Events />)

    await waitFor(() => {
      expect(
        screen.getByText('No events yet. Create one to get started.'),
      ).toBeInTheDocument()
    })
  })

  it('shows an error when the API request fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    })

    renderWithRouter(<Events />)

    await waitFor(() => {
      expect(
        screen.getByText('Request failed with status 503'),
      ).toBeInTheDocument()
    })
  })

  it('requests a filtered event list', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse([]),
    })

    renderWithRouter(<Events />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/events?limit=10&offset=0')
    })

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse([]),
    })

    await user.selectOptions(screen.getByLabelText('Filter by type'), 'Fake')

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith(
        '/api/events?limit=10&offset=0&event_type=Fake',
      )
    })
  })

  it('deletes an event after confirmation', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        paginatedResponse([
          {
            event_id: 1,
            event_name: 'Quarterly Security Review',
            event_type: 'Both',
          },
        ]),
    })

    renderWithRouter(<Events />)

    await waitFor(() => {
      expect(screen.getByText('Quarterly Security Review')).toBeInTheDocument()
    })

    fetch.mockResolvedValueOnce({ ok: true, status: 204 })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => paginatedResponse([]),
    })

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/events/1', { method: 'DELETE' })
    })

    await waitFor(() => {
      expect(
        screen.getByText('No events yet. Create one to get started.'),
      ).toBeInTheDocument()
    })
  })
})
