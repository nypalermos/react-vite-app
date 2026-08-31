import { Link, NavLink, Route, Routes } from 'react-router'
import About from './pages/About.jsx'
import EventForm from './pages/EventForm.jsx'
import Events from './pages/Events.jsx'
import Home from './pages/Home.jsx'
import './App.css'

function App() {
  return (
    <div className="app">
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
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events/:id/edit" element={<EventForm />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </div>
  )
}

export default App
