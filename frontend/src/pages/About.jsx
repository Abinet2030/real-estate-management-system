import { Link } from 'react-router-dom'
import './about.css'
import { getPageCopy } from '../services/siteContent'

const principles = [
  ['Clarity first', 'Straightforward property information and tools that help people make confident decisions.'],
  ['Built on trust', 'A marketplace designed around better listing quality and responsive support.'],
  ['Made for progress', 'Practical workflows for finding, listing, and managing property in one place.'],
]

export default function About() {
  const copy = getPageCopy('about')
  return <main className="about-page">
    <section className="about-hero"><div><p>{copy.kicker}</p><h1>{copy.title}</h1><span>{copy.description}</span></div></section>
    <section className="about-intro"><div className="about-container"><div className="intro-copy"><p className="section-label">Our purpose</p><h2>Better decisions begin with a better property experience.</h2></div><p>We make it easier to explore homes, compare opportunities, and connect with the people behind each listing. Our focus is simple: less friction, more clarity, and a platform people can trust from first search to final inquiry.</p></div></section>
    <section className="about-principles"><div className="about-container"><div className="section-title"><p className="section-label">What guides us</p><h2>Designed around the moments that matter.</h2></div><div className="principle-grid">{principles.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
    <section className="about-metrics"><div className="about-container metrics-grid"><div><b>&lt; 24h</b><span>Typical support response</span></div><div><b>99.9%</b><span>Marketplace availability</span></div><div><b>4.8/5</b><span>Customer satisfaction</span></div><div><b>One place</b><span>To explore and manage property</span></div></div></section>
    <section className="about-cta"><div><p className="section-label">Start your search</p><h2>Find a property with more confidence.</h2><p>Browse current listings or get in touch with the Relstate team.</p><div><Link to="/properties">Explore properties <span>→</span></Link><Link className="secondary" to="/contact">Contact support</Link></div></div></section>
  </main>
}
