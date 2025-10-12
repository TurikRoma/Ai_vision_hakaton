import { Link } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import ProgressBar from "../components/ProgressBar";
import ApexChart from "../components/charts/ApexChart";
import { useApp } from "../context/AppContext";

export default function Results() {
  const { state } = useApp();
  const data = state.analysis;

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-3">Нет данных анализа</h1>
        <p className="text-slate-600 mb-6">
          Сделайте фото и запустите анализ, чтобы увидеть результаты.
        </p>
        <Link
          to="/scan"
          className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-5 py-3 text-white font-medium shadow hover:bg-cyan-700"
        >
          Перейти к сканированию
        </Link>
      </div>
    );
  }

  const { scores, summary, recommendations, imagePreview, createdAt } = data;

  // Build chart data
  const flat = {
    Stress: scores.stress,
    Fatigue: scores.fatigue,
    Anxiety: scores.anxiety,
    Skin_Redness: scores.skin.redness,
    Skin_Dryness: scores.skin.dryness,
    Skin_Pigmentation: scores.skin.pigmentation,
    Eyes_Redness: scores.eyes.redness,
    Eyes_DarkCircles: scores.eyes.darkCircles,
    Eyes_ScleraTint: scores.eyes.scleraYellowing,
    General_Puffiness: scores.general.puffiness,
    General_Pallor: scores.general.pallor,
  };
  const entries = Object.entries(flat);
  const avg = entries.reduce((acc, [, v]) => acc + v, 0) / entries.length;
  const wellbeing = Math.max(0, Math.min(1, 1 - avg)); // higher is better
  const wellbeingPct = Math.round(wellbeing * 100);

  const radarNames = [
    "Стресс",
    "Усталость",
    "Тревожность",
    "Кожа: покраснения",
    "Кожа: сухость",
    "Кожа: пигментация",
    "Глаза: покраснение",
    "Глаза: тёмные круги",
    "Глаза: оттенок склер",
    "Общее: отёчность",
    "Общее: бледность",
  ];
  const radarSeries = [
    {
      name: "Уровень",
      data: [
        scores.stress,
        scores.fatigue,
        scores.anxiety,
        scores.skin.redness,
        scores.skin.dryness,
        scores.skin.pigmentation,
        scores.eyes.redness,
        scores.eyes.darkCircles,
        scores.eyes.scleraYellowing,
        scores.general.puffiness,
        scores.general.pallor,
      ].map((x) => Math.round(x * 100)),
    },
  ];

  const topRisk = entries
    .map(([k, v]) => ({
      label: k.replace(/_/g, " "),
      value: Math.round(v * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${new Date(createdAt).toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fakeSend() {
    alert(
      "Демо: отчёт «отправлен» врачу. TODO(API): подключите отправку на бэкенд."
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: preview and summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <img
              src={imagePreview}
              alt="preview"
              className="w-full rounded-lg object-cover"
            />
            <div className="mt-4 text-sm text-slate-500">
              Создано: {new Date(createdAt).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-medium text-slate-900 mb-2">Итог</div>
            <p className="text-sm text-slate-700">{summary}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadJson}
              className="rounded-md bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Скачать отчёт (JSON)
            </button>
            <button
              onClick={fakeSend}
              className="rounded-md bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-700"
            >
              Отправить врачу
            </button>
            <Link
              to="/scan"
              className="rounded-md bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
            >
              Новый анализ
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            TODO(API): в файле{" "}
            <code className="rounded bg-slate-100 px-1">src/lib/api.js</code>{" "}
            замените mock вызовы на реальные эндпоинты.
          </p>
        </div>

        {/* Right: metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts row */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-medium text-slate-900">
                Индекс самочувствия
              </h3>
              <ApexChart
                type="bar"
                height={300}
                series={[
                  {
                    name: "Индекс",
                    data: [wellbeingPct, 72],
                  },
                ]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: {
                    bar: {
                      borderRadius: 6,
                      horizontal: false,
                      columnWidth: "50%",
                    },
                  },
                  xaxis: { categories: ["Ваш", "Средний"] },
                  colors: ["#22d3ee", "#10b981"],
                  dataLabels: { enabled: true, formatter: (val) => `${val}%` },
                  grid: { strokeDashArray: 3 },
                  yaxis: { max: 100, min: 0 },
                }}
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-sm font-medium text-slate-900">
                Профиль показателей
              </h3>
              <ApexChart
                type="radar"
                height={320}
                series={radarSeries}
                options={{
                  xaxis: { categories: radarNames },
                  yaxis: { max: 100, min: 0, tickAmount: 5 },
                  stroke: { width: 2 },
                  fill: { opacity: 0.2 },
                  markers: { size: 3 },
                  colors: ["#22d3ee"],
                }}
              />
            </div>
          </section>

          {/* Top risk bar */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-medium text-slate-900">
              Топ факторов риска
            </h3>
            <ApexChart
              type="bar"
              height={320}
              series={[{ name: "Уровень", data: topRisk.map((x) => x.value) }]}
              options={{
                chart: { stacked: false },
                plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
                xaxis: { categories: topRisk.map((x) => x.label) },
                colors: ["#f43f5e"],
                dataLabels: { enabled: true, formatter: (val) => `${val}%` },
                grid: { strokeDashArray: 3 },
              }}
            />
          </section>

          {/* Legend */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-8 rounded bg-gradient-to-r from-emerald-400 to-teal-500"></span>
                Ниже — лучше (зелёный)
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-8 rounded bg-gradient-to-r from-cyan-400 to-sky-500"></span>
                Средний уровень
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-8 rounded bg-gradient-to-r from-rose-400 to-pink-500"></span>
                Выше — хуже (красный)
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Эмоциональное состояние
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="Стресс" value={scores.stress} />
              <MetricCard title="Усталость" value={scores.fatigue} />
              <MetricCard title="Тревожность" value={scores.anxiety} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Состояние кожи
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="Покраснения" value={scores.skin.redness} />
              <MetricCard title="Сухость" value={scores.skin.dryness} />
              <MetricCard
                title="Пигментация"
                value={scores.skin.pigmentation}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Область глаз
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="Покраснение" value={scores.eyes.redness} />
              <MetricCard
                title="Тёмные круги"
                value={scores.eyes.darkCircles}
              />
              <MetricCard
                title="Оттенок склер"
                value={scores.eyes.scleraYellowing}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Общие признаки
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard title="Отёчность" value={scores.general.puffiness} />
              <MetricCard title="Бледность" value={scores.general.pallor} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Рекомендации
            </h2>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
              {recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
