import { Link, NavLink, useLocation } from 'react-router-dom'

export default function Navbar() {
  const loc = useLocation()
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold">AI</span>
            <span className="font-semibold text-slate-900">AIFace</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>
              Главная
            </NavLink>
            <NavLink to="/scan" className={linkClass}>
              Сканирование
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Профиль
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/scan"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
            >
              Начать сканирование
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
