import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError, type ApiError } from '../lib/http';

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `load` whenever `deps` change; ignores responses from superseded runs.
 * `keepPrevious` keeps showing the old data while the next result loads (useful for pagination).
 */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[], keepPrevious = false): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: ApiError | null; loading: boolean }>({ data: null, error: null, loading: true });
  const runId = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(() => {
    const id = ++runId.current;
    setState((s) => ({ data: keepPrevious ? s.data : null, error: null, loading: true }));
    loadRef.current().then(
      (data) => { if (id === runId.current) setState({ data, error: null, loading: false }); },
      (err) => {
        const apiErr = toApiError(err);
        if (id === runId.current && apiErr.code !== 'CANCELLED') setState((s) => ({ data: keepPrevious ? s.data : null, error: apiErr, loading: false }));
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    return () => { runId.current++; };
  }, [run]);

  return { ...state, reload: run };
}
