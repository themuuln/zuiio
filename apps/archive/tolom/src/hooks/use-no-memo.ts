/**
 * Workaround for React Compiler caching `getVirtualItems()` results.
 * De-opts only this call, not the entire component.
 *
 * @see https://github.com/TanStack/virtual/issues/743
 */
export const useNoMemo = <const T>(factory: () => T): T => {
  "use no memo";
  return factory();
};
