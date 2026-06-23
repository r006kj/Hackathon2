import { useEffect, useReducer, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Signal, SignalFeedResponse, SignalType, Severity, SignalStatus } from '../types/api';
import { api, ApiException } from '../lib/apiClient';

// ─── State & Reducer ──────────────────────────────────────────────────────────
interface State {
  items: Signal[];
  nextCursor: string | null;
  isLoadingInitial: boolean;  // first load / filter change
  isLoadingMore: boolean;     // loading next page
  error: string | null;
  hasMore: boolean;
}

type Action =
  | { type: 'RESET' }                                          // filter changed
  | { type: 'LOAD_INITIAL' }
  | { type: 'LOAD_MORE' }
  | { type: 'OK_INITIAL'; items: Signal[]; nextCursor: string | null }
  | { type: 'OK_MORE';    items: Signal[]; nextCursor: string | null }
  | { type: 'ERR';        msg: string };

function dedup(existing: Signal[], incoming: Signal[]): Signal[] {
  const seen = new Set(existing.map((s) => s.id));
  return [...existing, ...incoming.filter((s) => !seen.has(s.id))];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESET':
      return { items: [], nextCursor: null, isLoadingInitial: true, isLoadingMore: false, error: null, hasMore: true };
    case 'LOAD_INITIAL':
      return { ...state, isLoadingInitial: true, error: null };
    case 'LOAD_MORE':
      return { ...state, isLoadingMore: true, error: null };
    case 'OK_INITIAL':
      return {
        items: action.items,
        nextCursor: action.nextCursor,
        isLoadingInitial: false,
        isLoadingMore: false,
        error: null,
        hasMore: action.nextCursor !== null,
      };
    case 'OK_MORE':
      return {
        items: dedup(state.items, action.items),
        nextCursor: action.nextCursor,
        isLoadingInitial: false,
        isLoadingMore: false,
        error: null,
        hasMore: action.nextCursor !== null,
      };
    case 'ERR':
      return { ...state, isLoadingInitial: false, isLoadingMore: false, error: action.msg };
    default:
      return state;
  }
}

const INITIAL_STATE: State = {
  items: [],
  nextCursor: null,
  isLoadingInitial: true,
  isLoadingMore: false,
  error: null,
  hasMore: true,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface SignalFilters {
  signalType?: SignalType;
  severity?: Severity;
  status?: SignalStatus;
  q?: string;
}

export function useInfiniteSignals() {
  const [params, setParams] = useSearchParams();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Read filters from URL
  const signalType = (params.get('signalType') as SignalType | null) ?? undefined;
  const severity   = (params.get('severity')   as Severity   | null) ?? undefined;
  const status     = (params.get('status')     as SignalStatus | null) ?? undefined;
  const q          = params.get('q') ?? undefined;

  // Build a stable key to detect filter changes
  const filterKey = `${signalType}|${severity}|${status}|${q}`;

  // Reset + initial load when filters change
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    inFlightRef.current = true;

    dispatch({ type: 'RESET' });

    api
      .get<SignalFeedResponse>('/api/v1/signals/feed', {
        params: { signalType, severity, status, q },
        signal: ctrl.signal,
      })
      .then(({ items, nextCursor }) => {
        inFlightRef.current = false;
        dispatch({ type: 'OK_INITIAL', items, nextCursor });
      })
      .catch((e: unknown) => {
        inFlightRef.current = false;
        if ((e as Error).name === 'AbortError') return;
        const msg = e instanceof ApiException ? e.data.message : 'Error al cargar señales';
        dispatch({ type: 'ERR', msg });
      });

    return () => {
      ctrl.abort();
      inFlightRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Load next page (called by IntersectionObserver or retry button)
  const loadMore = useCallback(() => {
    if (inFlightRef.current || !state.hasMore || state.nextCursor === null) return;

    inFlightRef.current = true;
    dispatch({ type: 'LOAD_MORE' });

    const cursor = state.nextCursor;

    api
      .get<SignalFeedResponse>('/api/v1/signals/feed', {
        params: { signalType, severity, status, q, cursor },
      })
      .then(({ items, nextCursor }) => {
        inFlightRef.current = false;
        dispatch({ type: 'OK_MORE', items, nextCursor });
      })
      .catch((e: unknown) => {
        inFlightRef.current = false;
        const msg = e instanceof ApiException ? e.data.message : 'Error al cargar más señales';
        dispatch({ type: 'ERR', msg });
      });
  }, [state.hasMore, state.nextCursor, signalType, severity, status, q]);

  // Retry on error: if we have items it's a "load more" retry, else re-trigger initial
  const retry = useCallback(() => {
    if (state.items.length > 0) {
      loadMore();
    } else {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      inFlightRef.current = true;
      dispatch({ type: 'LOAD_INITIAL' });

      api
        .get<SignalFeedResponse>('/api/v1/signals/feed', {
          params: { signalType, severity, status, q },
          signal: ctrl.signal,
        })
        .then(({ items, nextCursor }) => {
          inFlightRef.current = false;
          dispatch({ type: 'OK_INITIAL', items, nextCursor });
        })
        .catch((e: unknown) => {
          inFlightRef.current = false;
          if ((e as Error).name === 'AbortError') return;
          const msg = e instanceof ApiException ? e.data.message : 'Error al cargar señales';
          dispatch({ type: 'ERR', msg });
        });
    }
  }, [state.items.length, loadMore, signalType, severity, status, q]);

  // Filter setters (write to URL)
  const setFilter = useCallback(
    (key: string, value: string | undefined) =>
      setParams(
        (prev) => {
          if (value) { prev.set(key, value); } else { prev.delete(key); }
          return prev;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    ...state,
    filters: { signalType, severity, status, q },
    loadMore,
    retry,
    setFilter,
  };
}