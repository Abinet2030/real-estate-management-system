import { useEffect, useRef, useState } from 'react'

export default function Stats() {
  const items = [
    { label: 'Properties Listed', to: 500 },
    { label: 'Happy Clients', to: 100 },
    { label: 'Verified Agents', to: 50 },
  ]
  return (
    <section className="stats-section">
      <div className="stats-inner">
        {items.map((i) => (
          <KPI key={i.label} to={i.to} label={i.label} />
        ))}
      </div>
    </section>
  )
}

function KPI({ to = 0, label = '' }){
  const { ref, value } = useCountUp(to, { duration: 1600, trigger: 'bottom' })
  return (
    <div ref={ref} className="stat-item">
      <div>{value}+ </div><span>{label}</span>
    </div>
  )
}

// Intersection-aware count up hook (starts when near bottom of viewport)
function useCountUp(target = 0, { duration = 1500, trigger = 'bottom' } = {}){
  const ref = useRef(null)
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(()=>{
    const el = ref.current
    if (!el) return
    const options = trigger === 'bottom'
      ? { threshold: 0.6, rootMargin: '0px 0px -15% 0px' }
      : { threshold: 0.2 }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if (entry.isIntersecting && !startedRef.current){
          startedRef.current = true
          const start = performance.now()
          const tick = (now)=>{
            const p = Math.min(1, (now - start)/duration)
            const val = Math.floor(target * p)
            setValue(val)
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      })
    }, options)
    io.observe(el)
    return ()=> io.disconnect()
  }, [target, duration, trigger])

  return { ref, value }
}
