import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";

export default function Profile() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await api.fetchHistory();
        setHistory(data);
      } catch (err) {
        setError("Не удалось загрузить историю анализов.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Статистика теперь тоже будет основана на загруженной истории
  const stats = useMemo(() => {
    const count = history.length;
    const last = history.length > 0 ? history[0].created_at : null;
    return { count, last };
  }, [history]);

  function openItem(item) {
    dispatch({ type: "SET_ANALYSIS", payload: item });
    navigate("/results");
  }

  function deleteItem(id) {
    dispatch({ type: "DELETE_HISTORY_ITEM", payload: id });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-10 lg:grid-cols-3">
      {/* Profile stats */}
      <section className="space-y-4 lg:col-span-1">
        <h1 className="text-2xl font-semibold">Профиль</h1>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Статистика</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Всего анализов</span>
              <span className="font-medium">{stats.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Последний</span>
              <span className="font-medium">
                {stats.last ? new Date(stats.last).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* History list */}
      <section className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">История анализов</h2>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Очистить историю?")) {
                  history.forEach((h) =>
                    dispatch({ type: "DELETE_HISTORY_ITEM", payload: h.id })
                  );
                }
              }}
              className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Очистить
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Загрузка истории анализов...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Нет сохранённых анализов. Проведите анализ на странице
            «Сканирование».
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {item.image_path ? (
                  <img
                    src={item.image_path}
                    alt={`Analysis from ${new Date(
                      item.created_at
                    ).toLocaleDateString()}`}
                    className="h-48 w-full object-cover bg-slate-100"
                  />
                ) : (
                  <div className="h-48 w-full bg-slate-200 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-slate-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="text-sm text-slate-500">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-700">
                    {item.summary ||
                      "Анализ от " +
                        new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => openItem(item)}
                      className="rounded-md bg-primary px-3 py-2 text-sm text-white transition-opacity hover:opacity-90"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
