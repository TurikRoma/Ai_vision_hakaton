export default function ProgressBar({ value = 0, label, color = 'auto' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))

  // Map of fixed gradients
  const gradients = {
    indigo: 'from-indigo-400 to-violet-500',
    cyan: 'from-cyan-400 to-sky-500',
    emerald: 'from-emerald-400 to-teal-500',
    rose: 'from-rose-400 to-pink-500',
    sky: 'from-sky-400 to-cyan-500',
  }

  // Auto mode: green (good) -> cyan (mid) -> red (bad)
  let gradientClass
  if (color === 'auto') {
    if (value <= 0.33) gradientClass = gradients.emerald
    else if (value <= 0.66) gradientClass = gradients.cyan
    else gradientClass = gradients.rose
  } else {
    gradientClass = gradients[color] || gradients.cyan
  }

  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded bg-slate-200">
        <div
          className={`h-2 rounded bg-gradient-to-r ${gradientClass}`}
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    </div>
  )
}
