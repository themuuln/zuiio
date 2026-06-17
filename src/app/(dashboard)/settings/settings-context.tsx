"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type SaveHandler = {
  id: string;
  label: string;
  save: () => Promise<{ error?: string } | undefined>;
  isDirty: () => boolean;
};

type SettingsContextValue = {
  registerSave: (handler: SaveHandler) => void;
  unregisterSave: (id: string) => void;
  saveAll: () => Promise<number>;
  saving: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, SaveHandler>>(new Map());
  const [saving, setSaving] = useState(false);
  const [, forceRender] = useState(0);

  const registerSave = useCallback((handler: SaveHandler) => {
    handlersRef.current.set(handler.id, handler);
    forceRender((n) => n + 1);
  }, []);

  const unregisterSave = useCallback((id: string) => {
    handlersRef.current.delete(id);
    forceRender((n) => n + 1);
  }, []);

  const saveAll = useCallback(async () => {
    setSaving(true);
    const handlers = Array.from(handlersRef.current.values());
    let errorCount = 0;
    for (const h of handlers) {
      try {
        const result = await h.save();
        if (result?.error) {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }
    setSaving(false);
    return errorCount;
  }, []);

  return (
    <SettingsContext.Provider
      value={{ registerSave, unregisterSave, saveAll, saving }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function useRegisterSave(handler: SaveHandler) {
  const { registerSave, unregisterSave } = useSettings();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // Store a proxy that always reads the latest handler functions via the ref.
    // Without this, dirtyCount would never update because the stored handler
    // captures the initial isDirty/save functions.
    const proxy: SaveHandler = {
      get id() {
        return handlerRef.current.id;
      },
      get label() {
        return handlerRef.current.label;
      },
      save: () => handlerRef.current.save(),
      isDirty: () => handlerRef.current.isDirty(),
    };
    registerSave(proxy);
    return () => unregisterSave(proxy.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
