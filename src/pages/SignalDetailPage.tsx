import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSignalDetail } from '../hooks/useSignalDetail';
import type { Severity, SignalStatus, SignalType } from '../types/api';

// ─── Badge helpers ────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<Severity, string> = {
  LOW:      'text-gray-400 bg-gray-700/60',
  MEDIUM:   'text-yellow-300 bg-yellow-900/40',
  HIGH:     'text-orange-400 bg-orange-900/40',
  CRITICAL: 'text-red-400 bg-red-900/40',
};

const STATUS_COLOR: Record<SignalStatus, string> = {
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

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  kind: 'success' | 'error';
}

function Toast({ message, kind }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl
                  shadow-2xl text-sm font-medium border transition-all animate-in
                  ${kind === 'success'
                    ? 'bg-green-900 border-green-600 text-green-200'
                    : 'bg-red-900 border-red-600 text-red-200'
                  }`}
    >
      <span>{kind === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-700 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-700 rounded-full w-20" />
        <div className="h-5 bg-gray-700 rounded-full w-24" />
      </div>
      <div className="h-4 bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
      <div className="h-4 bg-gray-700 rounded w-4/6" />
      <div className="mt-6 h-10 bg-gray-700 rounded-lg w-40" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function SignalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading, error, isMutating, toast, updateStatus } = useSignalDetail(id ?? '');

  // Determine where Back goes (from state or default to /signals)
  const fromPath = (location.state as { from?: string })?.from ?? '/signals';

  // Restore scroll on back
  const scrollRestored = useRef(false);
  function goBack() {
    const y = sessionStorage.getItem('signals-scroll');
    if (y) sessionStorage.removeItem('signals-scroll');
    navigate(fromPath, { replace: true });
    // Scroll restoration is handled by the browser / React Router ScrollRestoration
    // but we also do it manually after navigation using the stored value
    if (y) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: Number(y), behavior: 'instant' });
      });
    }
  }

  // Focus management: focus the heading on load
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!isLoading && data && !scrollRestored.current) {
      headingRef.current?.focus();
      scrollRestored.current = true;
    }
  }, [isLoading, data]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast */}
      {toast && <Toast message={toast.message} kind={toast.kind} />}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={goBack}
            aria-label="Volver al feed de señales"
            className="text-gray-400 hover:text-white transition-colors text-sm
                       focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2
                       flex items-center gap-1"
          >
            ← Volver
          </button>
          <span className="text-gray-600 text-sm">Detalle de Señal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Loading */}
        {isLoading && <Skeleton />}

        {/* Error */}
        {!isLoading && error && (
          <div className="bg-red-900/40 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {!isLoading && data && (
          <article>
            {/* Title */}
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-white mb-3 focus:outline-none"
            >
              {data.title}
            </h1>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SEVERITY_COLOR[data.severity]}`}>
                {data.severity}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[data.status]}`}>
                {data.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold text-cyan-400 bg-cyan-900/30">
                {TYPE_LABEL[data.type] ?? data.type}
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6">
              <p className="text-gray-300 text-sm leading-relaxed">{data.description}</p>
            </div>

            {/* Metadata grid */}
            <dl className="grid grid-cols-2 gap-4 mb-8 text-sm">
              {[
                { label: 'Tropel ID',  value: data.tropelId },
                { label: 'Sector ID',  value: data.sectorId },
                { label: 'Creado',     value: new Date(data.createdAt).toLocaleString('es-PE') },
                { label: 'Actualizado',value: new Date(data.updatedAt).toLocaleString('es-PE') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <dt className="text-gray-500 text-xs mb-0.5">{label}</dt>
                  <dd className="text-white font-mono text-xs break-all">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Status mutation section */}
            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Actualizar estado</h2>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Cambiar estado de la señal">
                {(['PROCESANDO', 'ATENDIDA'] as const).map((newStatus) => {
                  const isCurrent = data.status === newStatus;
                  return (
                    <button
                      key={newStatus}
                      onClick={() => updateStatus(newStatus)}
                      disabled={isMutating || isCurrent}
                      aria-pressed={isCurrent}
                      aria-busy={isMutating}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                  focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2
                                  disabled:cursor-not-allowed
                                  ${isCurrent
                                    ? 'bg-cyan-800 text-cyan-200 opacity-70'
                                    : 'bg-cyan-700 hover:bg-cyan-600 text-white disabled:opacity-40'
                                  }`}
                    >
                      {isMutating ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white
                                           rounded-full animate-spin" />
                          Guardando…
                        </span>
                      ) : isCurrent ? (
                        `✓ ${newStatus}`
                      ) : (
                        `Marcar ${newStatus}`
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inline mutation error (also shown in toast) */}
              {!isMutating && toast?.kind === 'error' && (
                <p className="mt-3 text-red-400 text-xs">{toast.message}</p>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}