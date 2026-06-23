import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LoginPage }        from './pages/LoginPage';
import { DashboardPage }    from './pages/DashboardPage';
import { TropelsPage }      from './pages/TropelsPage';
import { SignalFeedPage }   from './pages/SignalFeedPage';
import { SignalDetailPage } from './pages/SignalDetailPage';
// CP5 → import { SectorStoryPage } from './pages/SectorStoryPage';

// ─── Shared authenticated layout with nav ─────────────────────────────────────
function AppLayout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors px-3 py-1.5 rounded-md
     ${isActive
       ? 'text-cyan-400 bg-cyan-900/30'
       : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
     }`;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <span className="text-cyan-400 font-bold text-sm tracking-wide">TropelCare Control Room</span>

        <nav className="flex items-center gap-1" aria-label="Navegación principal">
          <NavLink to="/"       end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/tropels"    className={linkClass}>Tropeles</NavLink>
          <NavLink to="/signals"    className={linkClass}>Señales</NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs hidden sm:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="text-xs text-red-400 hover:text-red-300 transition-colors
                       focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2 rounded"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/tropels"     element={<TropelsPage />} />
              <Route path="/signals"     element={<SignalFeedPage />} />
              <Route path="/signals/:id" element={<SignalDetailPage />} />
              {/* <Route path="/sectors/:id/story" element={<SectorStoryPage />} /> */}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}