import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import { useApp } from '../context/AppContext'
import { analyzeImage } from '../lib/api'

export default function Scan() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [localImage, setLocalImage] = useState(state.imageDataUrl)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const camRef = useRef(null)

  function onFileChange(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите файл изображения.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Слишком большой файл. Выберите до 8 МБ.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLocalImage(reader.result)
      dispatch({ type: 'SET_IMAGE', payload: reader.result })
    }
    reader.readAsDataURL(file)
  }

  function onCapture(dataUrl) {
    setLocalImage(dataUrl)
    dispatch({ type: 'SET_IMAGE', payload: dataUrl })
  }

  async function onAnalyze() {
    if (!localImage) {
      setError('Сначала добавьте фото или сделайте снимок.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // TODO(API): replace analyzeImage with real /analyses/ POST when backend is ready
      const result = await analyzeImage({ imageDataUrl: localImage })
      dispatch({ type: 'SET_ANALYSIS', payload: result })
      dispatch({ type: 'SAVE_TO_HISTORY', payload: result })
      navigate('/results')
    } catch (e) {
      setError('Не удалось выполнить анализ. Повторите попытку.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top hero like the reference */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Сделайте селфи</h1>
          <p className="mt-2 text-slate-600">Мы подскажем, как лучше сделать фото, а затем покажем визуальные метрики и рекомендации.</p>
          <h2 className="mt-8 text-2xl sm:text-3xl font-semibold text-slate-900">Или загрузите своё фото</h2>
          <p className="mt-2 text-slate-600">Убедитесь, что освещение хорошее, лицо в кадре, ничего не закрывает обзор.</p>

          {/* Guidance icons */}
          <div className="mt-6 flex items-center justify-center gap-6 text-slate-400">
            <div className="grid place-items-center h-14 w-14 rounded-full ring-1 ring-slate-200">
              <span className="text-xl">💡</span>
            </div>
            <div className="grid place-items-center h-14 w-14 rounded-full ring-1 ring-slate-200">
              <span className="text-xl">📐</span>
            </div>
            <div className="grid place-items-center h-14 w-14 rounded-full ring-1 ring-slate-200">
              <span className="text-xl">🪞</span>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">Мы не сохраняем изображения, сделанные в демо‑режиме.</p>

          {/* Big actions */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="cursor-pointer rounded-lg border-2 border-slate-300 px-6 py-4 text-slate-900 hover:bg-slate-50">
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <div className="text-base sm:text-lg font-semibold">Загрузить фото</div>
            </label>
            <button
              onClick={async () => {
                setShowCamera(true)
                // Try to auto start if ref available
                setTimeout(() => camRef.current?.start?.(), 0)
              }}
              className="rounded-lg bg-slate-900 px-6 py-4 text-white text-base sm:text-lg font-semibold hover:bg-black"
            >
              Сделать селфи
            </button>
          </div>
        </div>
      </div>

      {/* Preview / camera and actions */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {showCamera ? (
            <CameraCapture ref={camRef} onCapture={onCapture} autoStart />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {localImage ? (
                <img src={localImage} alt="preview" className="w-full rounded-lg object-cover" />
              ) : (
                <div className="aspect-[3/4] w-full rounded-lg bg-slate-50 grid place-items-center text-slate-400">
                  Предпросмотр будет здесь
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Действия</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onAnalyze}
              disabled={loading || !localImage}
              className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-6 py-3 text-white font-medium shadow hover:bg-cyan-700 disabled:opacity-60"
            >
              {loading ? 'Анализ...' : 'Анализировать'}
            </button>
            <button
              onClick={() => {
                setLocalImage(null)
                dispatch({ type: 'SET_IMAGE', payload: null })
              }}
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-6 py-3 text-slate-700 hover:bg-slate-200"
            >
              Сбросить
            </button>
            {showCamera && (
              <button
                onClick={() => {
                  camRef.current?.stop?.()
                  setShowCamera(false)
                }}
                className="inline-flex items-center justify-center rounded-md bg-slate-100 px-6 py-3 text-slate-700 hover:bg-slate-200"
              >
                Закрыть камеру
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Демо-режим: результаты генерируются случайно. Для реальной интеграции подключите эндпоинты в
            <code className="ml-1 rounded bg-slate-100 px-1">src/lib/api.js</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
