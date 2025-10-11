// Minimal header: left logo, right profile menu
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import AuthModal from "./AuthModal";
import logoUrl from "../assets/logo.svg?url";

export default function Header() {
  const { state, logout } = useApp();
  const { isAuthenticated } = state;
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDocClick(e) {
      if (!menuOpen) return;
      if (
        btnRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      )
        return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  async function onLogout() {
    logout(); // Вызываем logout из контекста
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Brand */}
            <a href="/" className="flex items-center gap-2">
              <img src={logoUrl} alt="logo" className="h-7 w-auto" />
            </a>

            {/* Profile menu or Login button */}
            <div className="relative flex items-center">
              {isAuthenticated ? (
                <>
                  <button
                    ref={btnRef}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-grid h-12 w-12 place-items-center rounded-full ring-1 ring-slate-200 bg-white hover:ring-slate-300"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    title="Профиль"
                  >
                    <img
                      src="/icon.svg"
                      alt="profile"
                      className="h-11 w-11 rounded-full"
                    />
                  </button>
                  {menuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                      role="menu"
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
                        role="menuitem"
                      >
                        История
                      </button>
                      <button
                        onClick={onLogout}
                        className="block w-full px-4 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50/60"
                        role="menuitem"
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
