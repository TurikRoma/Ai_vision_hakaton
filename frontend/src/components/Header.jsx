import { NavLink, Link } from 'react-router-dom'

function MenuItem({ label, to, children }) {
  const hasDropdown = Array.isArray(children) && children.length > 0
  return (
    <div className="relative group">
      <NavLink
        to={to || '#'}
        className={({ isActive }) =>
          `px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? 'text-white' : 'text-slate-300 hover:text-white'
          }`
        }
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {hasDropdown && <span className="text-slate-500 group-hover:text-slate-300">▾</span>}
        </span>
      </NavLink>
      {hasDropdown && (
        <div className="absolute left-0 top-full hidden min-w-[220px] translate-y-2 rounded-lg border border-slate-800/60 bg-slate-900/95 p-2 shadow-lg backdrop-blur group-hover:block">
          {children.map((item) => (
            <Link
              key={item.label}
              to={item.to || '#'}
              className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-cyan-400 to-sky-500 text-slate-900 font-bold">◈</span>
            <span className="text-base font-semibold text-white">AIFace</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <MenuItem label="Платформа" to="#" children={[
              { label: 'Возможности', to: '#' },
              { label: 'Безопасность', to: '#' },
              { label: 'Интеграции', to: '#' },
            ]} />
            <MenuItem label="Цены" to="#" />
            <MenuItem label="Компания" to="#" children={[
              { label: 'О нас', to: '#' },
              { label: 'Контакты', to: '#' },
            ]} />
            <MenuItem label="Ресурсы" to="#" children={[
              { label: 'Документация', to: '#' },
              { label: 'Руководства', to: '#' },
            ]} />
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/scan"
              className="inline-flex items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-600/10 px-3 py-1.5 text-sm font-medium text-cyan-300 hover:bg-cyan-600/20"
            >
              Scan yourself
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
