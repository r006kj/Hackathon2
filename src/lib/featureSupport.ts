/**
 * Feature-detection puro para las APIs "modernas" del Sector Story Engine.
 * Todo lo de aquí debe poder fallar de forma segura: si el navegador no
 * soporta algo, el resto del componente sigue funcionando de forma clásica.
 */

/** ¿El navegador soporta la View Transition API (document.startViewTransition)? */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/** ¿El navegador soporta CSS Scroll-driven Animations (animation-timeline: scroll()/view())? */
export function supportsScrollTimeline(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports('animation-timeline: scroll()') || CSS.supports('animation-timeline: view()');
}

/** Lee prefers-reduced-motion de forma segura (SSR / entornos sin matchMedia). */
export function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Ejecuta `apply` envuelto en una View Transition si está disponible.
 * Si no lo está (o el usuario prefiere menos movimiento), aplica el cambio
 * de forma directa: el fallback es "estado de React normal", como exige el spec.
 */
export function runWithViewTransition(apply: () => void, reducedMotion: boolean): void {
  if (reducedMotion || !supportsViewTransitions()) {
    apply();
    return;
  }
  // Tipado nativo desde TS 5.6+/lib.dom: document.startViewTransition existe en el tipo,
  // pero puede no existir en runtime en navegadores antiguos — por eso el feature-detect arriba.
  document.startViewTransition(apply);
}

/** Valida si un string es un color CSS válido (para confiar en colorToken del backend). */
export function isValidCssColor(value: string): boolean {
  if (!value) return false;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    return CSS.supports('color', value);
  }
  // Fallback sin CSS.supports: probamos asignándolo a un elemento desconectado.
  const probe = document.createElement('span');
  probe.style.color = '';
  probe.style.color = value;
  return probe.style.color !== '';
}
