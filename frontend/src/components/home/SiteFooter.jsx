import { Link } from 'react-router-dom'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <Link to="/" className="site-footer__logo" aria-label="Relstate home">
              <span className="site-footer__logo-mark" aria-hidden="true">R</span>
              Relstate
            </Link>
            <p>Your trusted platform to buy, sell, or rent real estate.</p>
          </div>

          <div className="site-footer__section">
            <h2>Explore</h2>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/help">Help</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="site-footer__section site-footer__contact">
            <h2>Get in touch</h2>
            <a href="mailto:hello@relstate.example">hello@relstate.example</a>
            <a href="tel:+251112345678">+251 11 234 5678</a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Relstate. All rights reserved.</span>
          <span>Find your next place with confidence.</span>
        </div>
      </div>
    </footer>
  )
}
