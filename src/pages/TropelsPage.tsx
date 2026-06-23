import { useTropels } from '../hooks/useTropels';
import type { PageSize } from '../hooks/useTropels';
import type { VitalState } from '../types/api';

const VITAL_BADGE: Record<VitalState, string> = {
  CRITICAL: 'text-red-400 bg-red-900/30',
  UNSTABLE: 'text-yellow-400 bg-yellow-900/30',
  STABLE:   'text-green-400 bg-green-900/30',
  UNKNOWN:  'text-gray-400 bg-gray-700',
};

export function TropelsPage() {
  const { data, isLoading, error, filters, setPage, setSize, setFilter } = useTropels();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold mb-6">Atlas de Tropeles</h1>

        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            placeholder="Especie"
            value={filters.species ?? ''}
            onChange={(e) => setFilter('species', e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-cyan-500"
          />
          <select
            value={filters.vitalState ?? ''}
            onChange={(e) => setFilter('vitalState', e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="">Estado vital</option>
            {(['CRITICAL', 'UNSTABLE', 'STABLE', 'UNKNOWN'] as VitalState[]).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <input
            placeholder="Sector ID"
            value={filters.sectorId ?? ''}
            onChange={(e) => setFilter('sectorId', e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-cyan-500"
          />
          <select
            value={filters.sort ?? ''}
            onChange={(e) => setFilter('sort', e.target.value || undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="">Ordenar por</option>
            <option value="name">Nombre</option>
            <option value="vitalState">Estado</option>
            <option value="createdAt">Fecha</option>
          </select>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-900/40 border border-red-600 text-red-200 text-sm
                          px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Especie</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Sector</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: filters.size }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-700/40">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="h-4 bg-gray-700 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : data?.content.map((t) => (
                    <tr key={t.id}
                        className="border-b border-gray-700/40 hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-gray-400">{t.species}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${VITAL_BADGE[t.vitalState]}`}>
                          {t.vitalState}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{t.sectorId}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ──────────────────────────────────────────────────── */}
        {data && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            {/* Tamaño de página — sólo valores que acepta el backend */}
            <div className="flex items-center gap-1">
              <span className="mr-1">Filas:</span>
              {([10, 20, 50] as PageSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-2 py-0.5 rounded transition-colors
                    ${filters.size === s ? 'bg-cyan-600 text-white' : 'hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Contador */}
            <span>
              {data.number * data.size + 1}–
              {Math.min((data.number + 1) * data.size, data.totalElements)}{' '}
              de {data.totalElements}
            </span>

            {/* Botones anterior / siguiente */}
            <div className="flex gap-2">
              <button
                onClick={() => setPage(filters.page - 1)}
                disabled={filters.page === 0 || isLoading}
                className="px-3 py-1 rounded border border-gray-700
                           disabled:opacity-30 hover:bg-gray-700 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(filters.page + 1)}
                disabled={filters.page >= data.totalPages - 1 || isLoading}
                className="px-3 py-1 rounded border border-gray-700
                           disabled:opacity-30 hover:bg-gray-700 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}