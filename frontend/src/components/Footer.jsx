export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          © {new Date().getFullYear()} AIFace. Демо-прототип для хакатона.
        </p>
        <p className="inline-flex items-center gap-2">
          <span className="hidden sm:inline">UI Only • No ML/Backend</span>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs">Demo</span>
        </p>
      </div>
    </footer>
  )
}
