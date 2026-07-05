import { useEffect, useRef } from 'react';

/**
 * Calls `callback` immediately, then every `intervalMs`, until unmounted.
 * `deps` restarts the interval if identity changes (e.g. a new screeningId).
 */
export default function usePolling(callback, intervalMs, deps = []) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (!cancelled) await savedCallback.current();
    };

    tick();
    const id = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
