import { useCallback, useEffect, useMemo, useRef } from "react";

type RequestScope = {
  active: boolean;
  pending: boolean;
};

// Each request owns a handle. Cleanup invalidates its scope; mutations stay
// inside this hook so callers cannot accidentally release another request's lock.
export function useRequestScope(owner: object, secondaryOwner?: object) {
  const scope = useRef<RequestScope>({ active: true, pending: false });

  useEffect(() => {
    const current: RequestScope = { active: true, pending: false };
    scope.current = current;
    return () => { current.active = false; };
  }, [owner, secondaryOwner]);

  const isBlocked = useCallback(() => !scope.current.active || scope.current.pending, []);

  const begin = useCallback(() => {
    const current = scope.current;
    if (!current.active || current.pending) return null;
    current.pending = true;
    return {
      isActive: () => current.active,
      finish: () => { current.pending = false; },
    };
  }, []);

  return useMemo(() => ({ begin, isBlocked }), [begin, isBlocked]);
}
