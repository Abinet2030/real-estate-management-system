import './home.css'
import { useLocation } from 'react-router-dom'
import Hero from '../components/home/Hero'
import FeaturedProperties from '../components/home/FeaturedProperties'
import Categories from '../components/home/Categories'
import HowItWorks from '../components/home/HowItWorks'
import TopAgents from '../components/home/TopAgents'
import Testimonials from '../components/home/Testimonials'
import Stats from '../components/home/Stats'
import Newsletter from '../components/home/Newsletter'
import SiteFooter from '../components/home/SiteFooter'

export default function Home({ q: qProp = '' }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const qFromUrl = params.get('q') || ''
  const q = String(qProp || '').length ? qProp : qFromUrl
  return (
    <main>
      <Hero />
      <FeaturedProperties q={q} />
      <Categories />
      <HowItWorks />
      <TopAgents />
      <Testimonials />
      <Stats />
      <Newsletter />
      <SiteFooter />
    </main>
  )
}
