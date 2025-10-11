import { useState } from "react";
import { api } from "../lib/api";
import { useApp } from "../context/AppContext";

export default function AuthModal({ onClose }) {
  const { login: loginContext } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await api.login({ email, password });
      } else {
        await api.signup({ email, password });
      }
      loginContext(); // Обновляем глобальное состояние
      onClose(); // Закрываем модалку
    } catch (err) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-800">
          {isLogin ? "Вход" : "Регистрация"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-600"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-primary focus:ring-primary"
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-600"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 shadow-sm focus:border-primary focus:ring-primary"
              required
            />
          </div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="ml-1 font-semibold text-primary hover:underline"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
}
