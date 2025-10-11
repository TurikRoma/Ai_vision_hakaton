import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'

export default function LightingModal() {
  const { state, dispatch } = useApp()

  useEffect(() => {
    if (state.showLightingModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [state.showLightingModal])

  if (!state.showLightingModal) return null

  function onAccept() {
    dispatch({ type: 'CLOSE_LIGHTING_MODAL' })
    dispatch({ type: 'CLEAR_INTENT' })
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
        <div className="px-8 pt-8 pb-6">
          <h3 className="text-2xl font-semibold text-slate-900 text-center">Перед началом</h3>
          <p className="mt-2 text-sm text-slate-600 text-center">Подготовьте лицо и пространство — это улучшит качество снимка.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5 place-items-stretch">
            <Tip title="Снимите очки" text="Уберите аксессуары, которые закрывают часть лица." />
            <Tip title="Без макияжа" text="Лёгкий уход — ок. Тональный и плотный макияж — нежелателен." />
            <Tip title="Не медицинский совет" text="Результаты носят ознакомительный характер и не заменяют консультацию врача." />
          </div>
          {/* нижние два блока удалены — остаются только 3 плитки */}
        </div>
        <div className="flex items-center justify-center border-t border-slate-200 bg-slate-50 px-8 py-4">
          <button
            onClick={onAccept}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Принять
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Tip({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-6 bg-white h-full">
      <div className="text-center space-y-1">
        <div className="text-base font-medium text-slate-900">{title}</div>
        <div className="text-sm text-slate-600 leading-relaxed">{text}</div>
      </div>
    </div>
  )
}

// удалены неиспользуемые иконки
