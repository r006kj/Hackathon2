import { useState, useEffect } from 'react';
import type { Signal, SignalStatus } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

interface State {
  data: Signal | null;
  isLoading: boolean;
  error: string | null;
}

interface MutationState {
  isMutating: boolean;
  mutationError: string | null;
  toast: { message: string; kind: 'success' | 'error' } | null;
}

export function useSignalDetail(id: string) {
  const [state, setState] = useState<State>({ data: null, isLoading: true, error: null });
  const [mutation, setMutation] = useState<MutationState>({
    isMutating: false,
    mutationError: null,
    toast: null,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ data: null, isLoading: true, error: null });

    api
      .get<Signal>(`/api/v1/signals/${id}`)
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof ApiException ? e.data.message : 'Error al cargar la señal';
        setState({ data: null, isLoading: false, error: msg });
      });

    return () => { cancelled = true; };
  }, [id]);

  const updateStatus = async (newStatus: 'PROCESANDO' | 'ATENDIDA') => {
    if (mutation.isMutating || !state.data) return;

    const previous = state.data.status;
    // Optimistic update
    setState((s) => s.data ? { ...s, data: { ...s.data, status: newStatus } } : s);
    setMutation({ isMutating: true, mutationError: null, toast: null });

    try {
      const updated = await api.patch<Signal>(`/api/v1/signals/${id}/status`, { status: newStatus });
      setState((s) => ({ ...s, data: updated }));
      setMutation({
        isMutating: false,
        mutationError: null,
        toast: { message: `Estado actualizado a ${newStatus}`, kind: 'success' },
      });
    } catch (e: unknown) {
      // Rollback
      setState((s) => s.data ? { ...s, data: { ...s.data, status: previous } } : s);
      const msg = e instanceof ApiException ? e.data.message : 'Error al actualizar el estado';
      setMutation({
        isMutating: false,
        mutationError: msg,
        toast: { message: msg, kind: 'error' },
      });
    } finally {
      // Clear toast after 4 seconds
      setTimeout(() => {
        setMutation((m) => ({ ...m, toast: null }));
      }, 4000);
    }
  };

  return { ...state, ...mutation, updateStatus };
}