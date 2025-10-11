import { useState } from 'react'

// FAQ content
const ITEMS = [
  {
    q: 'Что это за инструмент?',
    a: 'Это демо‑прототип интерфейса анализа по фото лица. Он демонстрирует пользовательский опыт, но не выполняет медицинскую диагностику.'
  },
  {
    q: 'Нужна ли регистрация?',
    a: 'Нет. В демо профиль и история сохраняются локально в вашем браузере и не отправляются на сервер.'
  },
  {
    q: 'Как обрабатывается моё фото?',
    a: 'Снимок используется локально для построения демонстрационных метрик. Для продакшена можно подключить бэкенд в src/lib/api.js (пометки TODO(API)).'
  },
  {
    q: 'Как читать метрики?',
    a: 'Шкалы подсвечиваются автоматически: зелёный — лучше, красный — хуже. Это визуализация самочувствия, не диагноз.'
  },
  {
    q: 'Можно ли сохранить или отправить результат?',
    a: 'Да. Доступно скачивание JSON. Кнопка «Отправить врачу» — демонстрационная.'
  },
  {
    q: 'Работает ли с мобильной камерой?',
    a: 'Да. На современных мобильных браузерах камера поддерживается. Разрешите доступ и убедитесь в хорошем освещении.'
  },
]

function Icon({ open }) {
  return (
    <span
      className={`grid h-6 w-6 place-items-center rounded-md border ${
        open ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-slate-300 text-slate-500'
      } transition-colors`}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={open ? 0 : 1}/>
      </svg>
    </span>
  )
}

function Item({ i, onToggle }) {
  return (
    <div className="border-b border-slate-200">
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={onToggle}
      >
        <span className="text-base font-medium text-slate-900">{i.q}</span>
        <Icon open={i.open} />
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          i.open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-60'
        }`}
      >
        <div className="min-h-0">
          <p className="pb-4 text-sm leading-relaxed text-slate-600">{i.a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [items, setItems] = useState(ITEMS.map((x) => ({ ...x, open: false })))

  function toggleIdx(idx) {
    setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, open: !x.open } : x)))
  }

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-semibold text-slate-900">FAQ</h2>
          <span className="text-sm text-slate-500">Обновляется по мере обратной связи</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {items.map((i, idx) => (
            <Item key={idx} i={i} onToggle={() => toggleIdx(idx)} />
          ))}
        </div>
      </div>
    </section>
  )
}
