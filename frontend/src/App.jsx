import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Scan from "./pages/Scan.jsx";
import Profile from "./pages/Profile.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import LightingModal from "./components/LightingModal.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import { useEffect } from "react";
import { navigation } from "./lib/navigation.js";
import Results from "./pages/Results.jsx";

// Компонент для инициализации навигации
function NavigationInjector() {
  const navigate = useNavigate();
  useEffect(() => {
    navigation.navigate = navigate;
    // Очистка при размонтировании
    return () => {
      navigation.navigate = null;
    };
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <NavigationInjector />
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50 text-slate-900">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/results" element={<Results />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <LightingModal />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
