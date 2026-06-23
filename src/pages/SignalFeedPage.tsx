import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInfiniteSignals } from '../hooks/useInfiniteSignals';
import type { Signal, SignalType, Severity, SignalStatus } from '../types/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_BADGE: Record<Severity, string> = {
  LOW:      'text-gray-400 bg-gray-700/60',
  MEDIUM:   'text-yellow-300 bg-yellow-900/40',
  HIGH:     'text-orange-400 bg-orange-900/40',
  CRITICAL: 'text-red-400 bg-red-900/40',
};

const STATUS_BADGE: Record<SignalStatus, string> = {
  ABIERTA:    'text-blue-400 bg-blue-900/40',
  PROCESANDO: 'text-yellow-400 bg-yellow-900/40',
  ATENDIDA:   'text-green-400 bg-green-900/40',
};

const TYPE_LABEL: Record<SignalType, string> = {
  HEALTH:        '🩺 Salud',
  BEHAVIORAL:    '🐾 Conducta',
  ENVIRONMENTAL: '🌿 Ambiente',
  SECURITY:      '🔒 Seguridad',
};

// ─── Signal Card ──────────────────────────────────────────────────────────────
interface SignalCardProps {
  signal: Signal;
  onClick: () => void;
}

function SignalCard({ signal, onClick }: SignalCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl p-4
                 hover:border-cyan-600/50 hover:bg-gray-700/50 transition-all
                 focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
      aria-label={`Ver detalle de señal: ${signal.title}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-white font-medium text-sm leading-snug">{signal.title}</span>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SEVERITY_BADGE[signal.severity]}`}>
            {signal.severity}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[signal.status]}`}>
            {signal.status}
          </span>
        </div>
      </div>

      <p className="text-gray-400 text-xs line-clamp-2 mb-3">{signal.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{TYPE_LABEL[signal.type] ?? signal.type}</span>
        <span>{new Date(signal.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
    </button>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────
function SignalSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse">
      <div className="flex justify-between gap-3 mb-2">
        <div className="h-4 bg-gray-700 rounded w-3/5" />
        <div className="h-4 bg-gray-700 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-700 rounded w-full mb-1.5" />
      <div className="h-3 bg-gray-700 rounded w-4/5 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 bg-gray-700 rounded w-16" />
        <div className="h-3 bg-gray-700 rounded w-24" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SignalFeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    isLoadingInitial,
    isLoadingMore,
    error,
    hasMore,
    filters,
    loadMore,
    retry,
    setFilter,
  } = useInfiniteSignals();

  // Sentinel element for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // stable — loadMoreRef handles fresh reference

  function handleCardClick(id: string) {
    // Persist scroll position key so detail page can restore it
    sessionStorage.setItem('signals-scroll', String(window.scrollY));
    navigate(`/signals/${id}`, { state: { from: location.pathname + location.search } });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold mb-4">Feed de Señales</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Signal type */}
            <select
              value={filters.signalType ?? ''}
              onChange={(e) => setFilter('signalType', e.target.value || undefined)}
              aria-label="Filtrar por tipo"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                         focus:outline-none focus:border-cyan-500"
            >
              <option value="">Tipo</option>
              {(['HEALTH', 'BEHAVIORAL', 'ENVIRONMENTAL', 'SECURITY'] as SignalType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>

            {/* Severity */}
            <select
              value={filters.severity ?? ''}
              onChange={(e) => setFilter('severity', e.target.value || undefined)}
              aria-label="Filtrar por severidad"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                         focus:outline-none focus:border-cyan-500"
            >
              <option value="">Severidad</option>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Severity[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filters.status ?? ''}
              onChange={(e) => setFilter('status', e.target.value || undefined)}
              aria-label="Filtrar por estado"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                         focus:outline-none focus:border-cyan-500"
            >
              <option value="">Estado</option>
              {(['ABIERTA', 'PROCESANDO', 'ATENDIDA'] as SignalStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Search */}
            <input
              type="search"
              placeholder="Buscar…"
              value={filters.q ?? ''}
              onChange={(e) => setFilter('q', e.target.value || undefined)}
              aria-label="Buscar señales"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm
                         focus:outline-none focus:border-cyan-500 min-w-[120px]"
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        {/* Initial loading state */}
        {isLoadingInitial && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando señales">
            {Array.from({ length: 6 }).map((_, i) => <SignalSkeleton key={i} />)}
          </div>
        )}

        {/* Initial error (no items yet) */}
        {!isLoadingInitial && error && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={retry}
              className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingInitial && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-500">
            <p className="text-4xl">📭</p>
            <p className="text-sm">No hay señales que coincidan con los filtros.</p>
          </div>
        )}

        {/* Signal list */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onClick={() => handleCardClick(signal.id)}
              />
            ))}

            {/* Loading more skeletons */}
            {isLoadingMore && (
              <>
                <SignalSkeleton />
                <SignalSkeleton />
              </>
            )}

            {/* Error loading more — keeps existing items */}
            {error && items.length > 0 && !isLoadingMore && (
              <div className="flex items-center justify-between bg-red-900/30 border border-red-700
                              text-red-300 text-sm px-4 py-3 rounded-xl">
                <span>{error}</span>
                <button
                  onClick={retry}
                  className="underline hover:text-red-200 ml-3 flex-shrink-0"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* End of list */}
            {!hasMore && !error && (
              <p className="text-center text-gray-600 text-xs py-4">
                — Fin del feed —
              </p>
            )}
          </div>
        )}

        {/* Invisible sentinel for IntersectionObserver */}
        <div ref={sentinelRef} aria-hidden="true" className="h-1" />
      </main>
    </div>
  );
}