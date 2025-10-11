import { useEffect, useMemo, useState } from 'react'

// Second section: 4 hover cards around a central face image.
// Images expected in src/assets/: hero-1.svg (base), hero-2.svg, hero-3.svg, hero-4.svg, hero-5.svg
// When no card hovered -> show hero-1 slightly smaller. Hovering a card smoothly shows one of hero-2..5.
export default function FaceFeatureShowcase() {
  // Load assets via Vite
  const assets = import.meta.glob('../assets/*.{svg,png,jpg,jpeg,webp,avif}', { eager: true, as: 'url' })
  const find = (name) => {
    const e = Object.entries(assets).find(([p]) => p.includes(`/assets/${name}.`))
    return e ? e[1] : null
  }
  const remoteFallback = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'

  // Base state must be hero-1 only (do not reuse hero-primary here)
  const base = find('hero-1') || remoteFallback

  // Randomize mapping of the 4 cards to variants hero-2..hero-5 once per mount
  const variants = useMemo(() => {
    const names = ['hero-2', 'hero-3', 'hero-4', 'hero-5']
    const urls = names.map(find).filter(Boolean)
    const arr = [...urls]
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  // 0 = base, 1..4 = variant index
  const [hoverIdx, setHoverIdx] = useState(0)
  const [src, setSrc] = useState(base)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const target = hoverIdx === 0 ? base : (variants[hoverIdx - 1] || base)
    // Trigger fade-out then swap src; image will fade-in on load
    setFade(true)
    const t = setTimeout(() => setSrc(target), 30)
    return () => clearTimeout(t)
  }, [hoverIdx, base, variants])

  // Preload images for smooth transitions
  useEffect(() => {
    const urls = [base, ...variants]
    urls.forEach((u) => { if (u) { const im = new Image(); im.src = u } })
  }, [base, variants])

  const onImgLoad = () => {
    // small delay for smoother feel
    const t = setTimeout(() => setFade(false), 20)
    return () => clearTimeout(t)
  }

  const cards = [
    { title: 'Точность измерений', text: 'Создаёт 3D‑модель лица для более точных метрик.' },
    { title: 'Детальные данные', text: 'Выдаёт подробные показатели для мониторинга.' },
    { title: 'Микродвижения', text: 'Фиксирует едва заметные движения лица.' },
    { title: 'Отслеживание пульса', text: 'Анализирует потоки и пульсовые волны под кожей.' },
  ]

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* Left column of two cards */}
          <div className="space-y-7">
            {cards.slice(0, 2).map((c, i) => (
              <FeatureCard
                key={i}
                index={i + 1}
                active={hoverIdx === i + 1}
                setHover={setHoverIdx}
                title={c.title}
                text={c.text}
              />
            ))}
          </div>

          {/* Center image */}
          <div className="relative mx-auto w-full max-w-[720px]">
            <img
              src={src}
              onLoad={onImgLoad}
              alt="Face"
              className={`w-full h-auto select-none transition-all duration-700 ease-out ${fade ? 'opacity-0' : 'opacity-100'} ${hoverIdx === 0 ? 'scale-[0.95]' : 'scale-100]'}`}
              draggable={false}
            />
          </div>

          {/* Right column of two cards */}
          <div className="space-y-7">
            {cards.slice(2, 4).map((c, i) => (
              <FeatureCard
                key={i + 2}
                index={i + 3}
                active={hoverIdx === i + 3}
                setHover={setHoverIdx}
                title={c.title}
                text={c.text}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ index, active, setHover, title, text }) {
  return (
    <div
      onMouseEnter={() => setHover(index)}
      onMouseLeave={() => setHover(0)}
      onFocus={() => setHover(index)}
      onBlur={() => setHover(0)}
      tabIndex={0}
      className={`rounded-2xl border p-5 transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:outline-none ${
        active ? 'border-emerald-700 ring-1 ring-emerald-700/30 bg-emerald-50' : 'border-slate-200'
      }`}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-600">{text}</div>
    </div>
  )
}
