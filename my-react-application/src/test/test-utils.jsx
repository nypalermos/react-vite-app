import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

export function renderWithEventRoutes(ui, { route = '/events/new' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/events/new" element={ui} />
        <Route path="/events/:id/edit" element={ui} />
      </Routes>
    </MemoryRouter>,
  )
}

export function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}
