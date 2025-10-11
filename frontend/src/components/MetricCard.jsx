import ProgressBar from './ProgressBar'

export default function MetricCard({ title, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-slate-700">{title}</div>
      <ProgressBar value={value} color={color} />
    </div>
  )
}
