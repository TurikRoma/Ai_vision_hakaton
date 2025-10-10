import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const PROFILE_KEY = 'aiface_profile_v1'

export default function Profile() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ name: '', email: '' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch (e) {}
  }, [])

  function saveProfile(e) {
    e.preventDefault()
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }

  const stats = useMemo(() => {
    const count = state.history.length
    const last = state.history[0]?.createdAt || null
    return { count, last }
  }, [state.history])

  function openItem(item) {
    dispatch({ type: 'SET_ANALYSIS', payload: item })
    navigate('/results')
  }

  function deleteItem(id) {
    dispatch({ type: 'DELETE_HISTORY_ITEM', payload: id })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-10 lg:grid-cols-3">
      {/* Profile form */}
      <section className="space-y-4 lg:col-span-1">
        <h1 className="text-2xl font-semibold">Профиль</h1>
        <form onSubmit={saveProfile} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Имя</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Иван"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Email</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="name@example.com"
            />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Сохранить</button>
          <p className="text-xs text-slate-500">Данные хранятся локально в вашем браузере.</p>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Статистика</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between"><span>Всего анализов</span><span className="font-medium">{stats.count}</span></div>
            <div className="flex items-center justify-between"><span>Последний</span><span className="font-medium">{stats.last ? new Date(stats.last).toLocaleString() : '—'}</span></div>
          </div>
        </div>
      </section>

      {/* History list */}
      <section className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">История анализов</h2>
          {state.history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Очистить историю?')) {
                  state.history.forEach((h) => dispatch({ type: 'DELETE_HISTORY_ITEM', payload: h.id }))
                }
              }}
              className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Очистить
            </button>
          )}
        </div>

        {state.history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Нет сохранённых анализов. Проведите анализ на странице «Сканирование».
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {state.history.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <img src={item.imagePreview} alt="preview" className="h-48 w-full object-cover" />
                <div className="p-4 space-y-2">
                  <div className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                  <div className="text-sm text-slate-700">{item.summary}</div>
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => openItem(item)} className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Открыть</button>
                    <button onClick={() => deleteItem(item.id)} className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200">Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
