import { forwardRef } from 'react';
import type { StoryStage } from '../../types/api';
import { formatMetricValue } from '../../lib/storyMetrics';

interface StageCardProps {
  stage: StoryStage;
  index: number;
  isActive: boolean;
}

export const StageCard = forwardRef<HTMLDivElement, StageCardProps>(function StageCard(
  { stage, index, isActive },
  ref,
) {
  return (
    <div
      ref={ref}
      id={`story-stage-${stage.id}`}
      tabIndex={-1}
      aria-current={isActive ? 'step' : undefined}
      className={`story-stage-card story-focusable scroll-mt-24 rounded-2xl border p-6 transition-colors duration-300
        ${isActive ? 'border-cyan-500 bg-gray-800/80' : 'border-gray-700 bg-gray-800/40'}`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Etapa {index + 1}</p>
      <h3 className="mt-1 text-xl font-bold text-white">{stage.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{stage.description}</p>

      {stage.metrics.length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {stage.metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-gray-400">{metric.label}</dt>
              <dd className="text-sm font-semibold text-white">{formatMetricValue(metric)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});
