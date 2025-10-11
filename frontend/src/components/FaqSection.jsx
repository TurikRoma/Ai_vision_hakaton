import { useRef, useState } from 'react'

export default function FaqSection() {
  const items = [
    {
      q: 'Как работает анализ по фото?',
      a: 'Это демо‑интерфейс. Реальная логика ML/медицины не подключена. Результаты генерируются псевдослучайно для демонстрации UI.',
    },
    {
      q: 'Храните ли вы мои изображения?',
      a: 'В демо‑режиме мы не загружаем и не сохраняем фото на сервер. Все данные остаются в памяти браузера до перезагрузки страницы.',
    },
    {
      q: 'Насколько точны показатели?',
      a: 'Показатели носят ознакомительный характер. Для реальных медицинских заключений требуются клинические исследования и сертификация.',
    },
    {
      q: 'Можно ли интегрировать это в продукт?',
      a: 'Да. Когда появится реальный бэкенд/ML, UI уже готов к интеграции: замените mock-функции в src/lib/api.js на реальные эндпоинты.',
    },
  ]

  const [open, setOpen] = useState(-1)
  const contentRefs = useRef([])

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 text-center">FAQ</h2>
          <p className="mt-3 text-base text-slate-600 text-center">Ответы на частые вопросы</p>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200 shadow-sm">
            {items.map((it, idx) => {
              const isOpen = open === idx
              const maxH = contentRefs.current[idx]?.scrollHeight || 0
              return (
                <div key={idx}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setOpen(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-lg font-semibold text-slate-900">{it.q}</span>
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    style={{ maxHeight: isOpen ? maxH + 24 : 0 }}
                  >
                    <div
                      ref={(el) => (contentRefs.current[idx] = el)}
                      className="px-6 pb-6 text-base leading-relaxed text-slate-700"
                    >
                      {it.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
