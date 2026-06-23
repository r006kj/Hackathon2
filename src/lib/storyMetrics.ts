import type { StageMetric, StoryStage } from '../types/api';

/**
 * Busca una métrica por label (case-insensitive) y la devuelve como número.
 * Soporta valores ya numéricos o strings numéricos ("72", "72%"). Si no existe
 * o no es parseable, devuelve null — el caller decide el fallback visual.
 */
export function getMetricNumber(stage: StoryStage, label: string): number | null {
  const metric = findMetric(stage, label);
  if (!metric) return null;
  const raw = typeof metric.value === 'number' ? metric.value : Number(String(metric.value).replace('%', ''));
  return Number.isFinite(raw) ? raw : null;
}

export function findMetric(stage: StoryStage, label: string): StageMetric | undefined {
  return stage.metrics.find((m) => m.label.toLowerCase() === label.toLowerCase());
}

/** Normaliza un valor a porcentaje 0–100, asumiendo escala 0–1 si viene fraccionario. */
export function toPercent(value: number | null): number | null {
  if (value === null) return null;
  const pct = value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, pct));
}

export function formatMetricValue(metric: StageMetric): string {
  if (typeof metric.value === 'number') {
    return metric.value <= 1 ? `${Math.round(metric.value * 100)}%` : `${metric.value}`;
  }
  return metric.value;
}
