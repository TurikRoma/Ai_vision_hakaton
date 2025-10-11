import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import hero1Url from '../assets/hero-1.svg?url'
import hero2Url from '../assets/hero-2.svg?url'
import hero3Url from '../assets/hero-3.svg?url'
import hero4Url from '../assets/hero-4.svg?url'
import hero5Url from '../assets/hero-5.svg?url'

// Second section: 4 hover cards around a central face image.
// Images expected in src/assets/: hero-1.svg (base), hero-2.svg, hero-3.svg, hero-4.svg, hero-5.svg
// When no card hovered -> show hero-1 slightly smaller. Hovering a card smoothly shows one of hero-2..5.
export default function FaceFeatureShowcase() {

function ScanButton() {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  return (
    <div className="absolute inset-x-0 -bottom-8 grid place-items-center">
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'SET_INTENT', payload: 'scan' })
          navigate('/scan')
        }}
        className="pointer-events-auto inline-flex items-center gap-3 rounded-3xl bg-emerald-300 px-10 py-5 text-slate-900 text-lg md:text-xl font-semibold shadow-lg shadow-emerald-300/30 ring-1 ring-emerald-400/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7V5a1 1 0 0 1 1-1h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 4h2a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 17v2a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6 20H5a1 1 0 0 1-1-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>Сканировать</span>
      </button>
    </div>
  )
}
  const remoteFallback = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'

  // Base image pinned to exact asset
  const base = hero1Url || remoteFallback

  // Randomize mapping of the 4 cards to variants hero-2..hero-5 once per mount
  const variants = useMemo(() => {
    const urls = [hero2Url, hero3Url, hero4Url, hero5Url].filter(Boolean)
    const arr = [...urls]
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  // 0 = base, 1..4 = variant index
  const [hoverIdx, setHoverIdx] = useState(0)
  const [currentSrc, setCurrentSrc] = useState(base)
  const [overlaySrc, setOverlaySrc] = useState(null)
  const [overlayOpaque, setOverlayOpaque] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const target = hoverIdx === 0 ? base : (variants[hoverIdx - 1] || base)
    if (!target || target === currentSrc) return
    // start crossfade
    if (timerRef.current) clearTimeout(timerRef.current)
    setOverlayOpaque(false)
    setOverlaySrc(target)
  }, [hoverIdx, base, variants, currentSrc])

  // Preload images for smooth transitions
  useEffect(() => {
    const urls = [base, ...variants]
    urls.forEach((u) => { if (u) { const im = new Image(); im.src = u } })
  }, [base, variants])

  const onOverlayLoad = () => {
    // start fading overlay in once the image is ready
    requestAnimationFrame(() => setOverlayOpaque(true))
  }

  // finalize crossfade once overlay is opaque
  useEffect(() => {
    if (!overlaySrc || !overlayOpaque) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrentSrc(overlaySrc)
      setOverlaySrc(null)
      setOverlayOpaque(false)
    }, 350)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [overlaySrc, overlayOpaque])

  const cards = [
    { title: 'Точность измерений', text: 'Создаёт 3D‑модель лица для более точных метрик.' },
    { title: 'Детальные данные', text: 'Выдаёт подробные показатели для мониторинга.' },
    { title: 'Микродвижения', text: 'Фиксирует едва заметные движения лица.' },
    { title: 'Отслеживание пульса', text: 'Анализирует потоки и пульсовые волны под кожей.' },
  ]

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_auto_1.25fr]">
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
          <div className="relative mx-auto w-full max-w-[640px]">
            {/* base image */}
            <img
              src={currentSrc}
              alt="Face"
              className="w-full h-auto select-none"
              draggable={false}
            />
            {/* overlay for crossfade */}
            {overlaySrc && (
              <img
                src={overlaySrc}
                onLoad={onOverlayLoad}
                alt="Face overlay"
                className={`absolute inset-0 w-full h-full object-contain select-none transition-opacity duration-500 ease-in-out ${overlayOpaque ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />
            )}
            {/* bottom gradient and scan button */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/70 to-transparent rounded-b-[inherit]"></div>
            <ScanButton />
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
      className={`rounded-2xl border p-8 lg:p-9 transition-all duration-300 ease-out bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none ${
        active ? 'border-emerald-700 ring-1 ring-emerald-700/30 bg-emerald-50' : 'border-slate-200'
      }`}
    >
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-base text-slate-600">{text}</div>
    </div>
  )
}
