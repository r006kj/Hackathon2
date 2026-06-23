import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import type { StoryStage } from '../types/api';
import { useSectorStory } from '../hooks/useSectorStory';
import { useStoryScroll } from '../hooks/useStoryScroll';
import { runWithViewTransition } from '../lib/featureSupport';
import { StoryAura } from '../components/story/StoryAura';
import { StageCard } from '../components/story/StageCard';
import { StoryNav } from '../components/story/StoryNav';
import '../styles/sector-story.css';

type Mode = 'summary' | 'story';

export function SectorStoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, retry } = useSectorStory(id);
  const [mode, setMode] = useState<Mode>('summary');

  const stages = data?.stages ?? [];
  const {
    activeIndex,
    progress,
    wrapperRef,
    registerStageRef,
    goToStage,
    prefersReducedMotion,
    supportsCssScrollTimeline,
  } = useStoryScroll(stages.length);

  function changeMode(next: Mode, focusIndex?: number) {
    runWithViewTransition(() => {
      flushSync(() => setMode(next));
      if (focusIndex !== undefined) goToStage(focusIndex);
    }, prefersReducedMotion);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-4">
        <Link to="/" className="story-focusable font-bold text-cyan-400 hover:text-cyan-300">
          ← TropelCare Control Room
        </Link>
        {mode === 'story' && stages.length > 0 && (
          <button
            type="button"
            onClick={() => changeMode('summary')}
            className="story-focusable text-sm text-gray-300 hover:text-white"
          >
            Volver al resumen
          </button>
        )}
      </header>

      {mode === 'story' && (
        <div className="story-progress-track h-1 w-full bg-gray-800" aria-hidden="true">
          <div
            className={`story-progress-fill h-full bg-cyan-400 ${
              supportsCssScrollTimeline ? 'story-progress-fill--scroll-driven' : ''
            }`}
            style={supportsCssScrollTimeline ? undefined : { transform: `scaleX(${progress})` }}
          />
        </div>
      )}

      <main className="mx-auto max-w-5xl px-6 py-10">
        {isLoading && (
          <>
            <p className="sr-only" role="status">
              Cargando historia del sector…
            </p>
            <StorySkeleton />
          </>
        )}

        {!isLoading && error && (
          <div className="flex items-center justify-between rounded-lg border border-red-600 bg-red-900/40 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button onClick={retry} className="story-focusable underline">
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && stages.length === 0 && (
          <p className="rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-6 text-center text-gray-400">
            Esta historia aún no tiene etapas registradas.
          </p>
        )}

        {!isLoading && !error && stages.length > 0 && mode === 'summary' && (
          <StorySummary
            sectorId={data?.sectorId ?? id ?? ''}
            stages={stages}
            onStart={() => changeMode('story', 0)}
            onSelectStage={(index) => changeMode('story', index)}
          />
        )}

        {!isLoading && !error && stages.length > 0 && mode === 'story' && (
          <>
            {/* Anuncia el cambio de etapa a lectores de pantalla (equivalente no visual del aura) */}
            <p className="sr-only" aria-live="polite">
              Etapa {activeIndex + 1} de {stages.length}: {stages[activeIndex]?.title}
            </p>

            <div className="flex gap-8">
              <div ref={wrapperRef} className="flex flex-1 flex-col gap-6">
                {stages.map((stage, index) => (
                  <StageCard
                    key={stage.id}
                    ref={registerStageRef(index)}
                    stage={stage}
                    index={index}
                    isActive={index === activeIndex}
                  />
                ))}
              </div>

              <StoryAura stage={stages[activeIndex] ?? null} activeIndex={activeIndex} total={stages.length} />
            </div>

            <StoryNav stages={stages} activeIndex={activeIndex} onSelect={goToStage} />
          </>
        )}
      </main>
    </div>
  );
}

// ─── Resumen general ──────────────────────────────────────────────────────────
interface StorySummaryProps {
  sectorId: string;
  stages: StoryStage[];
  onStart: () => void;
  onSelectStage: (index: number) => void;
}

function StorySummary({ sectorId, stages, onStart, onSelectStage }: StorySummaryProps) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-8">
      <p className="text-xs uppercase tracking-widest text-cyan-400">Sector {sectorId}</p>
      <h1 className="mt-1 text-2xl font-bold">Historia del sector</h1>
      <p className="mt-2 text-sm text-gray-400">
        {stages.length} etapas narrativas registradas. Hacé scroll a través de cada una para ver cómo
        evolucionan la estabilidad y la energía del sector.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="story-focusable mt-6 rounded-lg bg-cyan-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-cyan-500"
      >
        Comenzar la historia
      </button>

      <ol className="mt-8 space-y-2 border-t border-gray-700 pt-6">
        {stages.map((stage, index) => (
          <li key={stage.id}>
            <button
              type="button"
              onClick={() => onSelectStage(index)}
              className="story-focusable flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white"
            >
              <span className="text-gray-500">{index + 1}.</span>
              {stage.title}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────
function StorySkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-gray-700 bg-gray-800/40" />
      ))}
    </div>
  );
}
