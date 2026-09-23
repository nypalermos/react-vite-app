import { Link, NavLink, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthContext.jsx'
import { useAuth } from './auth/useAuth.js'
import RequireAuth from './auth/RequireAuth.jsx'
import About from './pages/About.jsx'
import EventForm from './pages/EventForm.jsx'
import Events from './pages/Events.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import './App.css'

function AppHeader() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="top-bar">
      <h1 className="app-title">
        <Link to="/">React Vite Application</Link>
      </h1>
      <nav className="top-nav">
        <NavLink to="/events" className="nav-link">
          Events
        </NavLink>
        <NavLink to="/about" className="about-link">
          About
        </NavLink>
        {isAuthenticated ? (
          <button type="button" className="time-button nav-auth-button" onClick={logout}>
            Sign out
          </button>
        ) : (
          <NavLink to="/login" className="nav-link">
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AppHeader />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route
            path="/events/new"
            element={
              <RequireAuth>
                <EventForm />
              </RequireAuth>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <RequireAuth>
                <EventForm />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
