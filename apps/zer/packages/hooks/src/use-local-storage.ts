import { useCallback, useEffect, useState } from "react";

function readFromStorage<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initial;
  } catch {
    return initial;
  }
}

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(() => readFromStorage(key, initial));

  useEffect(() => {
    setStored(readFromStorage(key, initial));
  }, [key, initial]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next =
          typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    setStored(initial);
  }, [key, initial]);

  return [stored, setValue, remove];
}
