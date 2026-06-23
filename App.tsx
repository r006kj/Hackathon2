import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TropelsPage }     from './pages/TropelsPage';
import { SectorStoryPage } from './pages/SectorStoryPage';
// CP3 → import { SignalFeedPage }  from './pages/SignalFeedPage';
// CP4 → import { SignalDetailPage } from './pages/SignalDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<DashboardPage />} />
            {<Route path="/tropels"              element={<TropelsPage />} /> }
            <Route path="/sectors/:id/story"     element={<SectorStoryPage />} />
            {/* <Route path="/signals"              element={<SignalFeedPage />} />   */}
            {/* <Route path="/signals/:id"          element={<SignalDetailPage />} /> */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}