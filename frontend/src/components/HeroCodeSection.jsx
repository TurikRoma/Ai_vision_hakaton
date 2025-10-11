import { useRef, useState } from 'react'
import heroPrimaryUrl from '../assets/hero-primary.svg?url'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function HeroCodeSection() {
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const fileRef = useRef(null)

  // Pin to exact asset to avoid glob ambiguity
  const primaryFromAssets = heroPrimaryUrl
  // Fallback order: assets -> public path -> remote placeholder (public path kept for manual overrides)
  const publicPrimary = '/hero-primary.svg'
  const remoteFallback = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'

  const [imgSrc, setImgSrc] = useState(primaryFromAssets || publicPrimary || remoteFallback)

  function onUploadClick() {
    dispatch({ type: 'SET_INTENT', payload: 'upload' })
    navigate('/scan')
  }

  function onScanClick() {
    dispatch({ type: 'SET_INTENT', payload: 'scan' })
    navigate('/scan')
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      dispatch({ type: 'SET_IMAGE', payload: dataUrl })
      navigate('/scan')
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left: text */}
          <div>
            <h1 className="text-[40px] leading-tight sm:text-[56px] font-semibold tracking-tight text-slate-900">
              Быстрый анализ
              <br /> здоровья по
              <br /> фотографии
            </h1>
            <p className="mt-5 max-w-xl text-slate-600 text-base">
              Технология искусственного интеллекта анализирует черты лица, чтобы предоставить информацию о здоровье кожи,
              уровне стресса и общем самочувствии
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onScanClick}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-white shadow transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 transform hover:scale-[1.02] active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7V5a1 1 0 0 1 1-1h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M18 4h2a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M20 17v2a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M6 20H5a1 1 0 0 1-1-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="font-semibold">Сканировать</span>
              </button>
              <button
                onClick={onUploadClick}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-700 px-6 py-3 text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 transform hover:scale-[1.02] active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M7 10l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-semibold">Загрузить фото</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
          </div>

          {/* Right: image, no frame clipping */}
          <div className="relative mx-auto w-full max-w-[520px] rounded-[36px] overflow-hidden">
            <img
              src={imgSrc}
              onError={(e) => { if (e.currentTarget.src !== remoteFallback) setImgSrc(remoteFallback) }}
              alt="Hero"
              className="w-full h-auto select-none"
              draggable={false}
            />
          </div>
        </div>

      </div>
    </section>
  )
}
