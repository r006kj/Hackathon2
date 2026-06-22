import { useState, useEffect, useCallback } from 'react';
import type { DashboardSummary } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

interface State {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<State>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    api
      .get<DashboardSummary>('/api/v1/dashboard/summary')
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) {
          const msg =
            e instanceof ApiException ? e.data.message : 'Error al cargar el dashboard';
          setState((s) => ({ ...s, isLoading: false, error: msg }));
        }
      });

    return () => { cancelled = true; };
  }, [version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, refetch };
}
