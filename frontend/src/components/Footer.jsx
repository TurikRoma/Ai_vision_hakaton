export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-slate-500 flex items-center justify-center">
        <p className="text-center">
          © {new Date().getFullYear()} AIFace. Демо-прототип для хакатона.
        </p>
      </div>
    </footer>
  )
}
