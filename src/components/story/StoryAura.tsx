import type { CSSProperties } from 'react';
import type { StoryStage } from '../../types/api';
import { getMetricNumber, toPercent } from '../../lib/storyMetrics';
import { isValidCssColor } from '../../lib/featureSupport';

interface CSSVars extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

interface StoryAuraProps {
  stage: StoryStage | null;
  activeIndex: number;
  total: number;
}

const FALLBACK_COLOR = '#111827';

/**
 * Visualización lateral/de fondo de la historia. Es puramente decorativa y
 * redundante con el contenido real de las tarjetas (título, descripción,
 * métricas), por eso se oculta a lectores de pantalla: la información
 * accesible vive en <StageCard /> y en el live-region de la página.
 */
export function StoryAura({ stage, activeIndex, total }: StoryAuraProps) {
  const color = stage && isValidCssColor(stage.colorToken) ? stage.colorToken : FALLBACK_COLOR;
  const stability = toPercent(stage ? getMetricNumber(stage, 'stability') : null);
  const energy = toPercent(stage ? getMetricNumber(stage, 'energy') : null);

  const style: CSSVars = { '--stage-color': color };

  return (
    <aside
      aria-hidden="true"
      className="story-aura relative hidden overflow-hidden rounded-2xl lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:w-72"
      style={style}
    >
      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">Etapa</p>
          <p className="text-3xl font-bold">
            {stage ? activeIndex + 1 : '–'} <span className="text-white/50">/ {total}</span>
          </p>
          <p className="mt-2 text-lg font-semibold leading-snug">{stage?.title ?? 'Cargando…'}</p>
        </div>

        <div className="space-y-4">
          <Gauge label="Estabilidad" value={stability} />
          <Gauge label="Energía" value={energy} />
        </div>
      </div>
    </aside>
  );
}

function Gauge({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-white/70">
        <span>{label}</span>
        <span>{value === null ? 's/d' : `${Math.round(value)}%`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white/90 transition-[width] duration-500 ease-out"
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}
