import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { SectorStory } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

interface State {
  data: SectorStory | null;
  isLoading: boolean;
  error: string | null;
}
type Action = { type: 'START' } | { type: 'OK'; data: SectorStory } | { type: 'ERR'; msg: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'START':
      return { ...s, isLoading: true, error: null };
    case 'OK':
      return { data: a.data, isLoading: false, error: null };
    case 'ERR':
      return { ...s, isLoading: false, error: a.msg };
  }
}

/**
 * Carga la historia narrativa de un sector (8 etapas). Misma forma que
 * useDashboard/useTropels: reducer + AbortController para descartar
 * respuestas obsoletas si el sectorId cambia rápido.
 */
export function useSectorStory(sectorId: string | undefined) {
  const [state, dispatch] = useReducer(reducer, { data: null, isLoading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!sectorId) {
      dispatch({ type: 'ERR', msg: 'Sector no especificado.' });
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    dispatch({ type: 'START' });

    api
      .get<SectorStory>(`/api/v1/sectors/${sectorId}/story`, { signal: ctrl.signal })
      .then((data) => dispatch({ type: 'OK', data }))
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        const msg = e instanceof ApiException ? e.data.message : 'Error al cargar la historia del sector';
        dispatch({ type: 'ERR', msg });
      });

    return () => ctrl.abort();
  }, [sectorId, version]);

  const retry = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, retry };
}
