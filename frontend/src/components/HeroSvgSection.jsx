import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
// Place your hero-section.svg in: src/assets/hero-section.svg
// This component inlines the SVG (via ?raw) so we can attach animations/handlers to its internal nodes.
import heroSvgRaw from '../assets/hero-section.svg?raw'

export default function HeroSvgSection() {
  const containerRef = useRef(null)
  const fileRef = useRef(null)
  const navigate = useNavigate()
  const { dispatch } = useApp()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Inject raw SVG once
    container.innerHTML = heroSvgRaw

    const svg = container.querySelector('svg')
    if (!svg) return

    // Make SVG responsive
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.width = '100%'
    svg.style.height = 'auto'
    svg.style.display = 'block'

    // Try to identify primary buttons and ensure focusability
    const scanBtn =
      svg.querySelector('#scan-btn, [data-action="scan"]') ||
      Array.from(svg.querySelectorAll('g, a, text'))
        .find((n) => (n.textContent || '').toLowerCase().includes('скан') || (n.textContent || '').toLowerCase().includes('scan'))

    const uploadBtn =
      svg.querySelector('#upload-btn, [data-action="upload"]') ||
      Array.from(svg.querySelectorAll('g, a, text'))
        .find((n) => (n.textContent || '').toLowerCase().includes('загруз') || (n.textContent || '').toLowerCase().includes('upload'))

    if (scanBtn) {
      scanBtn.setAttribute('data-action', 'scan')
      scanBtn.setAttribute('tabindex', '0')
      scanBtn.setAttribute('role', 'button')
      scanBtn.style.cursor = 'pointer'
      scanBtn.style.pointerEvents = 'auto'
    }
    if (uploadBtn) {
      uploadBtn.setAttribute('data-action', 'upload')
      uploadBtn.setAttribute('tabindex', '0')
      uploadBtn.setAttribute('role', 'button')
      uploadBtn.style.cursor = 'pointer'
      uploadBtn.style.pointerEvents = 'auto'
    }

    // Delegated handlers on the SVG root (reliable for nested paths)
    const hover = (el, on) => {
      if (!el) return
      el.style.transition = 'transform 220ms ease, filter 220ms ease'
      el.style.transform = on ? 'scale(1.03)' : 'scale(1)'
      el.style.filter = on ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))' : 'none'
    }

    const getBtn = (t) => t.closest('[data-action="scan"], #scan-btn, [data-action="upload"], #upload-btn')
    const isScan = (el) => el?.getAttribute('data-action') === 'scan' || el?.id === 'scan-btn'

    const onClick = (e) => {
      const btn = getBtn(e.target)
      if (!btn) return
      if (isScan(btn)) navigate('/scan')
      else fileRef.current?.click()
    }
    const onOver = (e) => {
      const btn = getBtn(e.target)
      hover(btn, true)
    }
    const onOut = (e) => {
      const btn = getBtn(e.target)
      hover(btn, false)
    }
    const onDown = (e) => {
      const btn = getBtn(e.target)
      if (!btn) return
      btn.style.transform = 'scale(0.98)'
    }
    const onUp = (e) => {
      const btn = getBtn(e.target)
      if (!btn) return
      btn.style.transform = 'scale(1.03)'
    }
    const onKey = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const btn = getBtn(e.target)
      if (!btn) return
      e.preventDefault()
      if (isScan(btn)) navigate('/scan')
      else fileRef.current?.click()
    }

    svg.addEventListener('click', onClick)
    svg.addEventListener('mouseover', onOver)
    svg.addEventListener('mouseout', onOut)
    svg.addEventListener('mousedown', onDown)
    svg.addEventListener('mouseup', onUp)
    svg.addEventListener('keydown', onKey)

    return () => {
      svg.removeEventListener('click', onClick)
      svg.removeEventListener('mouseover', onOver)
      svg.removeEventListener('mouseout', onOut)
      svg.removeEventListener('mousedown', onDown)
      svg.removeEventListener('mouseup', onUp)
      svg.removeEventListener('keydown', onKey)
    }
  }, [navigate])

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      // Save to global state so /scan page immediately sees preview
      dispatch({ type: 'SET_IMAGE', payload: dataUrl })
      navigate('/scan')
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div ref={containerRef} className="w-full" aria-label="Hero SVG Section" />
        {/* Hidden file input for Upload button inside SVG */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <p className="mt-3 text-xs text-slate-500">
          Подсказка: в файле SVG пометьте кликабельные группы как <code className="bg-slate-100 px-1 rounded">id="scan-btn"</code> и <code className="bg-slate-100 px-1 rounded">id="upload-btn"</code> — так анимации и клики будут максимально точными.
        </p>
      </div>
    </section>
  )
}
