import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  critical?: boolean;
}

function StatCard({ label, value, critical = false }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 border bg-gray-800
        ${critical ? 'border-red-500' : 'border-gray-700'}`}
    >
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${critical ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-800 rounded-xl border border-gray-700 h-24 animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data, isLoading, error, refetch } = useDashboard();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <span className="text-cyan-400 font-bold">TropelCare Control Room</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Título + Refetch */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Resumen Operativo</h2>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="text-cyan-400 hover:text-cyan-300 text-sm disabled:opacity-40 transition-colors"
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between bg-red-900/40 border border-red-600
                          text-red-200 text-sm px-4 py-3 rounded-lg mb-6">
            <span>{error}</span>
            <button onClick={refetch} className="underline">Reintentar</button>
          </div>
        )}

        {/* Contenido */}
        {isLoading && !data ? (
          <Skeleton />
        ) : data ? (
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Tropeles"        value={data.totalTropels} />
            <StatCard
              label="Tropeles Críticos"
              value={data.criticalTropels}
              critical={data.criticalTropels > 0}
            />
            <StatCard label="Señales Abiertas"      value={data.openSignals} />
            <StatCard
              label="Estabilidad Sectorial Prom."
              value={`${(data.sectorStabilityAvg * 100).toFixed(1)}%`}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}