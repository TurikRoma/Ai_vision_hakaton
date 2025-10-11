import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

// Simple camera capture component
// Provides start/stop preview and returns image as dataURL on capture
const CameraCapture = forwardRef(function CameraCapture({ onCapture, autoStart = false }, ref) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    if (autoStart) {
      start().catch(() => {})
    }
    return () => {
      mounted = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  async function start() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      }
    } catch (e) {
      setError('Не удалось получить доступ к камере. Разрешите доступ или используйте загрузку файла.')
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setReady(false)
  }

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    const size = Math.min(video.videoWidth || 720, 1080)
    const aspect = (video.videoHeight || 1280) / (video.videoWidth || 720)
    canvas.width = size
    canvas.height = Math.round(size * aspect)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCapture?.(dataUrl)
  }

  useImperativeHandle(ref, () => ({ start, stop, capture }), [])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {!ready ? (
          <button onClick={start} className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Включить камеру</button>
        ) : (
          <>
            <button onClick={capture} className="rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700">Сделать фото</button>
            <button onClick={stop} className="rounded-md bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200">Отключить</button>
          </>
        )}
      </div>
    </div>
  )
})

export default CameraCapture
