import { useMemo, useState } from 'react'

// Slider of face SVGs (or images) located in src/assets.
// By default it looks for: hero-primary.svg, hero-2.svg, hero-3.svg, hero-4.svg
// You can pass your own base names via props: <FaceSlider names={["girl-1","girl-2","girl-3","girl-4"]} />
export default function FaceSlider({ names }) {
  // Auto-discover assets as absolute URLs via Vite
  const assets = import.meta.glob('../assets/*.{svg,png,jpg,jpeg,webp,avif}', { eager: true, as: 'url' })
  const findAsset = (basename) => {
    const entry = Object.entries(assets).find(([p]) => p.includes(`/assets/${basename}.`))
    return entry ? entry[1] : null
  }

  const list = useMemo(() => {
    const defaults = ['hero-primary', 'hero-2', 'hero-3', 'hero-4']
    const baseNames = Array.isArray(names) && names.length ? names : defaults
    const urls = baseNames.map(findAsset).filter(Boolean)
    // If only one provided, still allow slider but no arrows disabled logic
    return urls.length ? urls : []
  }, [names])

  const [idx, setIdx] = useState(0)
  const hasSlides = list.length > 0
  const current = hasSlides ? list[idx % list.length] : null

  const prev = () => setIdx((i) => (i - 1 + list.length) % list.length)
  const next = () => setIdx((i) => (i + 1) % list.length)

  if (!hasSlides) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative mx-auto w-full max-w-[760px]">
          {/* Main image */}
          <img
            src={current}
            alt="Face"
            className="w-full h-auto select-none"
            draggable={false}
          />

          {/* Left button */}
          {list.length > 1 && (
            <button
              type="button"
              aria-label="Previous"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-11 w-11 rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Right button */}
          {list.length > 1 && (
            <button
              type="button"
              aria-label="Next"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-11 w-11 rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
