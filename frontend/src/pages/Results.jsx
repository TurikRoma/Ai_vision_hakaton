import { Link } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import ProgressBar from "../components/ProgressBar";
import ApexChart from "../components/charts/ApexChart";
import { useApp } from "../context/AppContext";
import { Accordion } from "../components/Accordion";

const detailedReport = {
  overallAssessment: `У тебя наблюдается специфическое сочетание факторов, которое требует внимания. Учитывая состояние кожи, периорбитальную зону и общее здоровье, есть несколько ключевых моментов, которые я хотел бы поделиться с тобой.`,
  fatigueLevel: `Твоя системная усталость не выражена, так как основной показатель - отсутствие темных кругов под глазами указывает на хорошее состояние.`,
  differentialAnalysis: [
    {
      title: "Кожный покров",
      content: `несмотря на то, что кожа твоего лица определяется как "baby", присутствие акне с высокой уверенностью (87.5%) требует внимания. Это нехарактерно для этой возрастной категории, поэтому следует выяснить причину возникновения.`,
    },
    {
      title: "Периорбитальная зона",
      content: `твоя периорбитальная зона демонстрирует высокую степень отечности (98.1%), что может сигнализировать о системных проблемах со здоровьем или возможных алергенных реакциях.`,
    },
    {
      title: "Офтальмологический статус",
      content: `наличие желтушности глаз (52.1%) тревожный сигнал и требует немедленной консультации медицинского специалиста. Это может быть связано с проблемами печени или другими серьезными состояниями.`,
    },
    {
      title: "Уровень стресса",
      content: `несмотря на низкую усталость, другие параметры, такие как отечность и проблема с глазами, возможно, указывают на стрессовое состояние организма.`,
    },
    {
      title: "Баланс здоровья",
      content: `в целом, балансирует между различными проявлениями, однако отечность и желтушность требуют особого внимания.`,
    },
    {
      title: "Системные взаимосвязи",
      content: `сочетание высокой отечности и желтушности глаз, вместе с акне, может свидетельствовать о системных проблемах, связанных с работой эндокринной или пищеварительной системы.`,
    },
  ],
  recommendations: {
    urgent: [
      `**Консультация врача** - незамедлительно следует посетить врача, чтобы исключить серьезные системные заболевания или нарушения функций печени из-за желтушности глаз.`,
    ],
    lifestyle: [
      `**Диета** - обрати внимание на баланс белков и углеводов в рационе, возможно исключение раздражающих компонентов, таких как сахар или молочные продукты.`,
      `**Увлажнение** - употребляй достаточное количество жидкости, чтобы улучшить состояние кожи и снизить отечность.`,
    ],
    care: [
      `**Уход за кожей** - идеально подойдет нежное очищение без агрессивных компонентов, чтобы не усугублять акне.`,
      `**Увлажнение кожи** - используй легкие увлажняющие или успока-ивающие кремы для лица, чтобы снять раздражение и улучшить общее состояние кожи.`,
    ],
  },
  whenToSeeDoctor: `Тебе необходимо обратиться к специалисту, если отечность и желтушность глаз не уменьшатся в течение пары дней. Появление дополнительных симптомов, таких как боль или ухудшение зрения, также являются триггерами для визита к офтальмологу или терапевту.`,
};

const BoldableText = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-slate-800">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

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
            <div className="text-sm font-medium text-slate-900 mb-2">
              Общая оценка
            </div>
            <p className="text-sm text-slate-700">
              {detailedReport.overallAssessment}
            </p>
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

          <section>
            <Accordion title="Детальный дифференциальный анализ" defaultOpen>
              <div className="space-y-4">
                {detailedReport.differentialAnalysis.map((item, i) => (
                  <div key={i}>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
            </Accordion>
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
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Срочные меры
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {detailedReport.recommendations.urgent.map((r, i) => (
                    <li key={i}>
                      <BoldableText text={r} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Оптимизация образа жизни
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {detailedReport.recommendations.lifestyle.map((r, i) => (
                    <li key={i}>
                      <BoldableText text={r} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Профилактика и уход
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {detailedReport.recommendations.care.map((r, i) => (
                    <li key={i}>
                      <BoldableText text={r} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-amber-900 mb-2">
              Когда обратиться к специалисту
            </h2>
            <p className="text-amber-800">{detailedReport.whenToSeeDoctor}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
