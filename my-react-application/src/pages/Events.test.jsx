import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Events from './Events.jsx'
import { renderWithRouter } from '../test/test-utils.jsx'

describe('Events', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders events returned by the API', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          event_id: 1,
          event_name: 'Quarterly Security Review',
          event_type: 'Both',
        },
      ],
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
  })

  it('shows an empty state when there are no events', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
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
})
