import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import ApexCharts from 'apexcharts'
import { analyzeImage } from '../lib/api'

export default function Scan() {
  const { state, dispatch } = useApp()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)

  const [status, setStatus] = useState('Подготовка камеры...')
  const [canCapture, setCanCapture] = useState(false)
  const [results, setResults] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeParam, setActiveParam] = useState(null)
  const [comparison, setComparison] = useState(null)
  const resultsRef = useRef(null)
  const insightRef = useRef(null)
  function handleParamSelect(key, value) {
    const comp = makeComparisonData(key, value)
    setActiveParam(key)
    setComparison(comp)
    try { document?.activeElement?.blur?.() } catch {}
    setTimeout(() => {
      try { insightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }, 50)
  }

  // Show lighting modal only when пришли по намерению "scan"
  useEffect(() => {
    if (state?.pendingIntent === 'scan') {
      dispatch({ type: 'OPEN_LIGHTING_MODAL' })
    }
  }, [state?.pendingIntent, dispatch])

  // MediaPipe FaceDetector via CDN (preloaded in index.html into window.TasksVision)
  const detectorRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const countdownRef = useRef(null)

  // Throttled status updates (no flicker, no starvation)
  const statusRef = useRef('Подготовка камеры...')
  const lastStatusCommitRef = useRef(0)
  const statusTimerRef = useRef(null)
  const pendingStatusRef = useRef(null)
  const minStatusGap = 350

  function setStatusSmooth(next) {
    const now = performance.now()
    const since = now - lastStatusCommitRef.current
    pendingStatusRef.current = next

    const commit = () => {
      const value = pendingStatusRef.current ?? next
      statusRef.current = value
      setStatus(value)
      lastStatusCommitRef.current = performance.now()
      statusTimerRef.current = null
      pendingStatusRef.current = null
    }

    if (since >= minStatusGap) {
      if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); statusTimerRef.current = null }
      commit()
    } else if (!statusTimerRef.current) {
      statusTimerRef.current = setTimeout(commit, Math.max(0, minStatusGap - since))
    }
  }

  // A bit less strict to simplify capturing (править при необходимости)
  const requiredConfidence = 0.7
  const requiredTime = 1500

  useEffect(() => {
    let stopped = false
    ;(async () => {
      try {
        const tv = window.TasksVision
        if (!tv) throw new Error('TasksVision не загружен')
        const vision =
          window.TasksVisionPreloadedVision ||
          (await tv.FilesetResolver.forVisionTasks('/mediapipe/wasm'))
        // Local model only; if отсутствует — явно сообщаем
        const modelUrl = '/models/blaze_face_short_range.tflite'
        const head = await fetch(modelUrl, { method: 'HEAD', cache: 'no-cache' })
        if (!head.ok) throw new Error('LOCAL_MODEL_MISSING')
        // Try GPU first, then CPU fallback
        try {
          detectorRef.current = await tv.FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: requiredConfidence,
          })
        } catch (gpuErr) {
          console.warn('GPU init failed, retrying with CPU', gpuErr)
          detectorRef.current = await tv.FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: requiredConfidence,
          })
        }
        if (!stopped) enableCam()
      } catch (e) {
        console.error(e)
        if (String(e?.message).includes('LOCAL_MODEL_MISSING')) {
          setStatusSmooth('Не найден локальный файл модели /models/blaze_face_short_range.tflite. Скачайте и положите его в папку public/models.')
        } else if (String(e).includes('Failed to fetch') || String(e).includes('ERR')) {
          setStatusSmooth('Не удалось загрузить локальные файлы WASM из /mediapipe/wasm. Скопируйте папку wasm из CDN в public/mediapipe/wasm.')
        } else {
          setStatusSmooth('Не удалось инициализировать детектор лиц.')
        }
      }
    })()
    return () => {
      stopped = true
      if (countdownRef.current) clearTimeout(countdownRef.current)
      if (statusTimerRef.current) { clearTimeout(statusTimerRef.current); statusTimerRef.current = null }
      const v = videoRef.current
      if (v?.srcObject) {
        v.srcObject.getTracks().forEach((t) => t.stop())
        v.srcObject = null
      }
    }
  }, [])

  function enableCam() {
    const v = videoRef.current
    if (!v) return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        v.srcObject = stream
        v.onloadeddata = () => requestAnimationFrame(predictWebcam)
      })
      .catch((err) => {
        console.error(err)
        setStatusSmooth('Доступ к камере отклонён.')
      })
  }

  function predictWebcam() {
    const v = videoRef.current
    const det = detectorRef.current
    if (!v || !det) return
    if (v.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = v.currentTime
      const detections = det.detectForVideo(v, performance.now())
      handleDetection(detections.detections)
    }
    requestAnimationFrame(predictWebcam)
  }

  function handleDetection(dets) {
    const v = videoRef.current
    if (!v) return
    const displayWidth = v.offsetWidth
    const displayHeight = v.offsetHeight
    const srcWidth = v.videoWidth || displayWidth || 1
    const srcHeight = v.videoHeight || displayHeight || 1
    const scaleX = displayWidth / srcWidth
    const scaleY = displayHeight / srcHeight

    // Овал более вытянутый: синхронно с overlay стилями ниже
    const ovalWidth = displayWidth * 0.52
    const ovalHeight = displayHeight * 0.82
    const ovalRadiusX = ovalWidth / 2
    const ovalRadiusY = ovalHeight / 2

    // Менее строгая проверка дистанции лица (править здесь)
    // Уменьшите minFaceWidthPercent — дальше от камеры
    // Увеличьте maxFaceWidthPercent — ближе к камере
    const minFaceWidthPercent = 0.30
    const maxFaceWidthPercent = 0.85
    const minPixelWidth = displayWidth * minFaceWidthPercent
    const maxPixelWidth = displayWidth * maxFaceWidthPercent

    let ok = false
    let text = 'Поместите лицо в овал.'

    if (dets.length > 1) {
      text = 'Обнаружено несколько лиц. Только одно в кадре.'
    } else if (dets.length === 1 && dets[0].categories?.[0]?.score >= requiredConfidence) {
      const bb = dets[0].boundingBox
      // Convert detector coordinates (source pixels) into displayed CSS pixels
      const cx = (bb.originX + bb.width / 2) * scaleX
      const cy = (bb.originY + bb.height / 2) * scaleY
      const inside =
        (Math.pow(cx - displayWidth / 2, 2) / Math.pow(ovalRadiusX, 2)) +
          (Math.pow(cy - displayHeight / 2, 2) / Math.pow(ovalRadiusY, 2)) <=
        1
      if (!inside) {
        text = 'Поместите лицо полностью в овал.'
      } else {
        // Face width in displayed pixels
        const w = bb.width * scaleX
        if (w < minPixelWidth) text = 'Слишком далеко. Приблизьтесь.'
        else if (w > maxPixelWidth) text = 'Слишком близко. Отодвиньтесь.'
        else {
          text = 'Отличное положение! Не двигайтесь...'
          ok = true
        }
      }
    } else {
      text = 'Лицо не обнаружено. Поместите его в овал.'
    }

    setStatusSmooth(text)
    if (ok) {
      if (!countdownRef.current) {
        countdownRef.current = setTimeout(() => {
          setCanCapture(true)
        }, requiredTime)
      }
    } else {
      setCanCapture(false)
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
        countdownRef.current = null
      }
    }
  }

  function onCapture() {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth
    c.height = v.videoHeight
    const g = c.getContext('2d')
    g.drawImage(v, 0, 0, c.width, c.height)
    const dataUrl = c.toDataURL('image/jpeg')
    console.log('Фото готово', dataUrl.substring(0, 40) + '...')

    // Fake analytics values (stub)
    const fake = {
      skinQuality: 74,
      eyeRedness: 18,
      eyeYellow: 9,
      darkCircles: 27,
      skinAge: 29,
    }
    // Add overall index based on 5 metrics (простая формула)
    fake.overallIndex = computeOverallIndex(fake)
    setIsAnalyzing(true)
    setResults(fake)
    setActiveParam(null)
    setComparison(null)
    // Скроллим к блоку результатов
    setTimeout(() => {
      try { resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }, 50)
    // Имитация анализа
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 1200)

    // Параллельно отправляем снимок на бэкенд (если доступен)
    ;(async () => {
      try {
        const res = await analyzeImage({ imageDataUrl: dataUrl })
        // Сохраняем краткую запись в локальную историю UI
        const item = {
          id: res?.id || Date.now(),
          createdAt: res?.createdAt || Date.now(),
          imagePreview: dataUrl,
          summary: res?.summary || 'Анализ сохранён',
        }
        try { dispatch({ type: 'SAVE_TO_HISTORY', payload: item }) } catch {}
      } catch (e) {
        // ignore
      }
    })()
  }

  function onUploadClick() {
    fileRef.current?.click()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-center text-2xl font-semibold tracking-tight">Сканирование лица</h1>
      </div>

      {/* Camera card — smaller and centered */}
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-slate-200 bg-white max-w-3xl mx-auto">
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline className="block w-full h-auto" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Овал без затемнения, только рамка */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-900/90"
            style={{ width: '52%', height: '82%' }}
          />

          {/* Controls */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 grid place-items-center">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onCapture}
                disabled={!canCapture}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-white shadow hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                title={canCapture ? 'Сделать фото' : 'Держите лицо в овале'}
              >
                Сделать фото
              </button>
              <button
                onClick={onUploadClick}
                className="rounded-xl border border-slate-300 bg-white/90 px-5 py-3 text-slate-900 shadow hover:bg-white"
              >
                Загрузить фото
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* Status banner above tips */}
      <div className="mt-4">
        <div className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 text-sm font-medium">
          Статус: {status}
        </div>
      </div>

      {/* Single modern tips block (no title) */}
      <div className="mt-6">
        <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 place-items-stretch">
            {[
              { t: 'Ровный свет без резких теней', i: TipIconSun },
              { t: 'Камера на уровне глаз', i: TipIconEye },
              { t: 'Лицо целиком в овале', i: TipIconFace },
              { t: 'Замрите на 1–2 секунды', i: TipIconTimer },
            ].map((x, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3 justify-center text-center">
                <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <x.i className="h-4 w-4" />
                </span>
                <div className="text-sm text-slate-700">{x.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results / Analysis */}
      {results && (
        <div ref={resultsRef} className="mt-8 space-y-6">
          {/* Step 1: Loader */}
          {isAnalyzing ? (
            <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-8 text-center">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <div className="text-base font-medium">Анализируем результаты…</div>
              <div className="text-sm text-slate-600">Это займёт несколько секунд</div>
            </div>
          ) : (
            <>
              {/* Step 2: Placeholder photo with parameter buttons around */}
              <div className="rounded-3xl ring-1 ring-slate-200 bg-white p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left buttons (3) */}
                  <div className="flex flex-col gap-3 order-2 lg:order-1">
                    <ParamButton active={activeParam==='skinQuality'} onClick={() => handleParamSelect('skinQuality', results.skinQuality)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Качество кожи</div><div className="text-sm font-medium opacity-80">{results.skinQuality}%</div></div>
                    </ParamButton>
                    <ParamButton active={activeParam==='eyeRedness'} onClick={() => handleParamSelect('eyeRedness', results.eyeRedness)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Покраснение глаз</div><div className="text-sm font-medium opacity-80">{results.eyeRedness}%</div></div>
                    </ParamButton>
                    <ParamButton active={activeParam==='eyeYellow'} onClick={() => handleParamSelect('eyeYellow', results.eyeYellow)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Желтизна глаз</div><div className="text-sm font-medium opacity-80">{results.eyeYellow}%</div></div>
                    </ParamButton>
                  </div>
                  {/* Center placeholder photo */}
                  <div className="order-1 lg:order-2">
                    <div className="aspect-[3/4] w-full rounded-3xl ring-1 ring-slate-200 bg-slate-100" />
                  </div>
                  {/* Right buttons (3) */}
                  <div className="flex flex-col gap-3 order-3">
                    <ParamButton active={activeParam==='darkCircles'} onClick={() => handleParamSelect('darkCircles', results.darkCircles)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Синяки под глазами</div><div className="text-sm font-medium opacity-80">{results.darkCircles}%</div></div>
                    </ParamButton>
                    <ParamButton active={activeParam==='skinAge'} onClick={() => handleParamSelect('skinAge', results.skinAge)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Возраст кожи</div><div className="text-sm font-medium opacity-80">{results.skinAge} лет</div></div>
                    </ParamButton>
                    <ParamButton active={activeParam==='overallIndex'} onClick={() => handleParamSelect('overallIndex', results.overallIndex)}>
                      <div className="flex items-center justify-between gap-3"><div className="text-sm">Общий индекс</div><div className="text-sm font-medium opacity-80">{results.overallIndex}%</div></div>
                    </ParamButton>
                  </div>
                </div>
              </div>

              {/* Step 3: Insight + comparison chart */}
              <div ref={insightRef} className="rounded-3xl ring-1 ring-slate-200 bg-white p-6">
                {activeParam ? (
                  <ParamInsight paramKey={activeParam} value={getParamValue(activeParam, results)} comparison={comparison} />
                ) : (
                  <div className="text-sm text-slate-600">Выберите параметр, чтобы увидеть сравнение и рекомендации.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Inline KPI and ApexChart helpers
function KPI({ label, value, suffix = '', tone = 'emerald' }) {
  const toneMap = {
    emerald: ['bg-emerald-50', 'text-emerald-700', 'border-emerald-200'],
    amber: ['bg-amber-50', 'text-amber-700', 'border-amber-200'],
    yellow: ['bg-yellow-50', 'text-yellow-700', 'border-yellow-200'],
    violet: ['bg-violet-50', 'text-violet-700', 'border-violet-200'],
  }
  const [bg, text, border] = toneMap[tone] || toneMap.emerald
  return (
    <div className={`rounded-2xl ${bg} ${text} border ${border} p-4`}> 
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-semibold">{value}{suffix}</div>
    </div>
  )
}

function ApexChart({ type, options = {}, series = [], height = 280 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const chart = new ApexCharts(ref.current, {
      chart: { type, height, animations: { enabled: true }, toolbar: { show: false } },
      series,
      ...options,
    })
    chart.render()
    return () => {
      try { chart.destroy() } catch {}
    }
    // We intentionally stringify deps for shallow comparison of options/series
  }, [type, height, JSON.stringify(options), JSON.stringify(series)])
  return <div ref={ref} />
}

// --- Parameters meta & helpers ---
const PARAMS_META = {
  skinQuality: { label: 'Качество кожи', unit: '%', goodHigh: true, threshold: 70,
    adviceBad: 'Старайтесь увлажнять кожу, пейте воду, используйте SPF и мягкое очищение.',
  },
  eyeRedness: { label: 'Покраснение глаз', unit: '%', goodHigh: false, threshold: 25,
    adviceBad: 'Отдых для глаз, уменьшить экранное время, увлажняющие капли по рекомендации специалиста.',
  },
  eyeYellow: { label: 'Желтизна глаз', unit: '%', goodHigh: false, threshold: 15,
    adviceBad: 'Пейте больше воды и обеспечьте полноценный сон; при стойких жалобах обратитесь к врачу.',
  },
  darkCircles: { label: 'Синяки под глазами', unit: '%', goodHigh: false, threshold: 30,
    adviceBad: 'Регулярный сон, достаточная гидратация, холодные компрессы и уход за кожей вокруг глаз.',
  },
  skinAge: { label: 'Возраст кожи', unit: ' лет', goodHigh: false, threshold: 32,
    adviceBad: 'Используйте SPF, базовый уход (очищение, увлажнение), включайте антиоксиданты.',
  },
  overallIndex: { label: 'Общий индекс', unit: '%', goodHigh: true, threshold: 70,
    adviceBad: 'Сфокусируйтесь на сне, увлажнении и SPF. Сбалансируйте уход и повторите проверку.',
  },
}

function getParamValue(key, results) {
  return results?.[key] ?? 0
}

function isParamOk(key, value) {
  const m = PARAMS_META[key]
  if (!m) return true
  return m.goodHigh ? value >= m.threshold : value <= m.threshold
}

function makeComparisonData(key, yourValue) {
  const m = PARAMS_META[key]
  if (!m) return null
  // Простейшая рандомизация мировых значений
  const rand = (a, b) => Math.round(a + Math.random() * (b - a))
  const worldAvg = m.goodHigh ? rand(55, 72) : rand(15, 35)
  const top25 = m.goodHigh ? rand(78, 90) : rand(5, 15)
  return { categories: ['Вы', 'Средний', 'Топ 25%'], values: [yourValue, worldAvg, top25] }
}

function computeOverallIndex(r) {
  const inv = (x) => Math.max(0, Math.min(100, 100 - x))
  const skinAgeScore = Math.max(0, Math.min(100, 100 - r.skinAge * 2)) // грубая нормализация
  const scores = [r.skinQuality, inv(r.eyeRedness), inv(r.eyeYellow), inv(r.darkCircles), skinAgeScore]
  const sum = scores.reduce((a, b) => a + b, 0)
  return Math.round(sum / scores.length)
}

// Simple tip icons (inline SVG)
function TipIconSun(props) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}><circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
)}
function TipIconEye(props) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>
)}
function TipIconFace(props) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}><circle cx="12" cy="12" r="9"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 10h.01M15 10h.01"/></svg>
)}
function TipIconTimer(props) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>
)}

function ParamInsight({ paramKey, value, comparison }) {
  const m = PARAMS_META[paramKey]
  if (!m) return null
  const ok = isParamOk(paramKey, value)
  const title = m.label
  const unit = m.unit || ''
  const msg = ok
    ? `По параметру «${title}» всё в норме. Ваш результат: ${value}${unit}.`
    : `По параметру «${title}» есть отклонение. Ваш результат: ${value}${unit}. Рекомендация: ${m.adviceBad}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div>
        <div className={`text-sm ${ok ? 'text-emerald-700' : 'text-amber-700'} font-medium`}>{msg}</div>
      </div>
      <div>
        {comparison && (
          <ApexChart
            type="bar"
            height={280}
            series={[{ name: 'Значение', data: comparison.values }]}
            options={{
              xaxis: { categories: comparison.categories },
              plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '45%' } },
              colors: ['#10b981'],
              chart: { toolbar: { show: false } },
              grid: { strokeDashArray: 3 },
            }}
          />
        )}
      </div>
    </div>
  )
}

function ParamButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl px-4 py-3 ring-1 ring-slate-200 shadow-sm transition ${
        active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white hover:bg-slate-50 text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

function renderParamButton(key, label, value, unit = '') {
  return (
    <ParamButton
      key={key}
      active={false}
      onClick={() => {
        const comp = makeComparisonData(key, value)
        setActiveParam(key)
        setComparison(comp)
        try { document?.activeElement?.blur?.() } catch {}
        setTimeout(() => { try { document?.querySelector('#insight-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {} }, 50)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">{label}</div>
        <div className="text-sm font-medium opacity-80">{value}{unit}</div>
      </div>
    </ParamButton>
  )
}
 
