import { Link } from 'react-router'

function About() {
  return (
    <main className="about-page">
      <div className="about-box">
        <h2>About React Vite</h2>
        <p>
          React Vite Application is a sample app for learning React with Vite.
          This landing page is the starting point for the UI.
        </p>
        <Link to="/" className="about-close">
          Back to home
        </Link>
      </div>
    </main>
  )
}

export default About
