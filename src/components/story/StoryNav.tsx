import type { KeyboardEvent } from 'react';
import type { StoryStage } from '../../types/api';

interface StoryNavProps {
  stages: StoryStage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Mueve el foco DOM al dot indicado (los dots usan roving tabindex). */
function focusDot(index: number) {
  document.getElementById(`story-dot-${index}`)?.focus();
}

export function StoryNav({ stages, activeIndex, onSelect }: StoryNavProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = stages.length - 1;
    let target: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = Math.min(last, index + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = Math.max(0, index - 1);
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = last;

    if (target === null) return;
    event.preventDefault();
    onSelect(target);
    focusDot(target);
  }

  return (
    <nav
      aria-label="Navegación de etapas de la historia"
      className="fixed right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex"
    >
      {stages.map((stage, index) => (
        <button
          key={stage.id}
          id={`story-dot-${index}`}
          type="button"
          aria-current={index === activeIndex ? 'step' : undefined}
          aria-label={`Ir a etapa ${index + 1} de ${stages.length}: ${stage.title}`}
          tabIndex={index === activeIndex ? 0 : -1}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`story-focusable h-2.5 w-2.5 rounded-full border transition-all
            ${index === activeIndex ? 'scale-125 border-cyan-400 bg-cyan-400' : 'border-gray-500 bg-transparent hover:bg-gray-600'}`}
        />
      ))}
    </nav>
  );
}
