import { useEffect, useReducer, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Tropel, PagedResponse, VitalState } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

// ─── Tamaños válidos que acepta el backend ────────────────────────────────────
const VALID_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof VALID_SIZES)[number];

function parseSize(v: string | null): PageSize {
  const n = Number(v);
  return (VALID_SIZES as readonly number[]).includes(n) ? (n as PageSize) : 10;
}

// ─── Estado ───────────────────────────────────────────────────────────────────
interface State {
  data: PagedResponse<Tropel> | null;
  isLoading: boolean;
  error: string | null;
}
type Action =
  | { type: 'START' }
  | { type: 'OK'; data: PagedResponse<Tropel> }
  | { type: 'ERR'; msg: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'START': return { ...s, isLoading: true, error: null };
    case 'OK':    return { data: a.data, isLoading: false, error: null };
    case 'ERR':   return { ...s, isLoading: false, error: a.msg };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTropels() {
  const [params, setParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, { data: null, isLoading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  // Leer filtros desde URL (fuente de verdad)
  const page      = Math.max(0, Number(params.get('page') ?? 0));
  const size      = parseSize(params.get('size'));
  const species   = params.get('species')   ?? undefined;
  const vitalState = (params.get('vitalState') as VitalState | null) ?? undefined;
  const sectorId  = params.get('sectorId')  ?? undefined;
  const sort      = params.get('sort')      ?? undefined;

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: 'START' });

    api
      .get<PagedResponse<Tropel>>('/api/v1/tropels', {
        params: { page, size, species, vitalState, sectorId, sort },
        signal: ctrl.signal,
      })
      .then((data) => dispatch({ type: 'OK', data }))
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        const msg = e instanceof ApiException ? e.data.message : 'Error al cargar tropeles';
        dispatch({ type: 'ERR', msg });
      });

    return () => ctrl.abort();
  }, [page, size, species, vitalState, sectorId, sort]);

  // Escribir filtros en URL (sync bidireccional)
  const setPage = useCallback(
    (p: number) =>
      setParams((prev) => { prev.set('page', String(p)); return prev; }, { replace: true }),
    [setParams],
  );

  const setSize = useCallback(
    (s: PageSize) =>
      setParams((prev) => { prev.set('size', String(s)); prev.set('page', '0'); return prev; }, { replace: true }),
    [setParams],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) =>
      setParams(
        (prev) => {
          if (value) { prev.set(key, value); } else { prev.delete(key); }
          prev.set('page', '0');
          return prev;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    ...state,
    filters: { page, size, species, vitalState, sectorId, sort },
    setPage,
    setSize,
    setFilter,
  };
}