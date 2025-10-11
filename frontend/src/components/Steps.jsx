// Steps section inspired by the provided reference.
// TODO(IMG): Replace image URLs below with your own assets when ready.

const STEPS = [
  {
    title: 'Шаг 1',
    subtitle: 'Сделайте селфи для сканирования',
    image: 'https://images.unsplash.com/photo-1593991890412-13dfd1d36f59?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Шаг 2',
    subtitle: 'Просмотрите результаты анализа',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Шаг 3',
    subtitle: 'Получите советы для улучшения ухода',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
  },
]

export default function Steps() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-3">
          {STEPS.map((s, idx) => (
            <div key={s.title} className="space-y-4">
              <div>
                <div className="text-slate-900 text-xl font-semibold">{s.title}</div>
                <div className="text-slate-600">{s.subtitle}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                {/* Simple mobile-like frame */}
                <div className="rounded-[2rem] border border-slate-300 bg-black/90 p-2">
                  <div className="relative overflow-hidden rounded-[1.7rem] bg-black">
                    <img src={s.image} alt={s.subtitle} className="h-80 w-full object-cover" />
                    <div className="absolute inset-x-0 top-0 mx-auto mt-2 h-5 w-32 rounded-b-2xl bg-black/60" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
