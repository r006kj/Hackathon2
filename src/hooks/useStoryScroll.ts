import { useCallback, useEffect, useRef, useState } from 'react';
import {
  readPrefersReducedMotion,
  supportsScrollTimeline,
  supportsViewTransitions,
} from '../lib/featureSupport';

interface UseStoryScrollResult {
  /** Índice (0-based) de la etapa actualmente activa según el scroll. */
  activeIndex: number;
  /** Progreso de lectura del contenedor de etapas, 0–1. Sólo se usa como fallback JS. */
  progress: number;
  /** Ref callback a colocar en el contenedor que envuelve TODAS las tarjetas de etapa. */
  wrapperRef: (el: HTMLDivElement | null) => void;
  /** Ref callback a colocar en cada tarjeta de etapa individual: registerStageRef(index). */
  registerStageRef: (index: number) => (el: HTMLDivElement | null) => void;
  /** Lleva el foco/scroll a una etapa concreta (usado por nav por teclado / dots). */
  goToStage: (index: number) => void;
  prefersReducedMotion: boolean;
  supportsCssScrollTimeline: boolean;
  supportsNativeViewTransitions: boolean;
}

export function useStoryScroll(stageCount: number): UseStoryScrollResult {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readPrefersReducedMotion);

  // Flags de soporte: se calculan una sola vez, no cambian durante la sesión.
  const [supportsCssScrollTimeline] = useState(supportsScrollTimeline);
  const [supportsNativeViewTransitions] = useState(supportsViewTransitions);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const stageElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const wrapperElRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── prefers-reduced-motion: escuchar cambios en vivo (el usuario puede togglearlo) ──
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // ── Etapa activa vía IntersectionObserver (mecanismo estándar, siempre activo) ──
  useEffect(() => {
    if (stageCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.stageIndex);
          if (Number.isNaN(index)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.index);
      },
      // Banda angosta alrededor del centro vertical del viewport: la tarjeta
      // que la cruza es la "etapa activa".
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    observerRef.current = observer;
    stageElsRef.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [stageCount]);

  const registerStageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      const map = stageElsRef.current;
      const prev = map.get(index);
      if (prev && observerRef.current) observerRef.current.unobserve(prev);
      if (el) {
        el.dataset.stageIndex = String(index);
        map.set(index, el);
        observerRef.current?.observe(el);
      } else {
        map.delete(index);
      }
    },
    [],
  );

  // ── Progreso de lectura: fallback JS, sólo relevante si no hay scroll-driven CSS ──
  useEffect(() => {
    if (supportsCssScrollTimeline) return; // el navegador lo hace nativamente vía CSS

    const computeProgress = () => {
      const el = wrapperElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const ratio = total > 0 ? scrolled / total : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        computeProgress();
      });
    };

    computeProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [supportsCssScrollTimeline]);

  const wrapperRef = useCallback((el: HTMLDivElement | null) => {
    wrapperElRef.current = el;
  }, []);

  const goToStage = useCallback(
    (index: number) => {
      const el = stageElsRef.current.get(index);
      el?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      // Foco explícito para que el lector de pantalla anuncie la tarjeta destino.
      el?.focus({ preventScroll: true });
    },
    [prefersReducedMotion],
  );

  return {
    activeIndex,
    progress,
    wrapperRef,
    registerStageRef,
    goToStage,
    prefersReducedMotion,
    supportsCssScrollTimeline,
    supportsNativeViewTransitions,
  };
}
