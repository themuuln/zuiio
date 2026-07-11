// Zustand stores — client state management
// Replaces Flutter's Riverpod providers

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppUser, AppRole } from "@/src/data/models";

// ─── Auth Store ─────────────────────────────────────────

interface AuthState {
  currentUser: AppUser | null;
  selectedUserId: number | null;
  setUser: (user: AppUser | null) => void;
  selectUser: (userId: number | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      selectedUserId: null,
      setUser: (user) => set({ currentUser: user }),
      selectUser: (userId) => set({ selectedUserId: userId }),
      signOut: () => set({ currentUser: null, selectedUserId: null }),
    }),
    {
      name: "tumurch-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── UI Store ───────────────────────────────────────────

interface UIState {
  activeRole: AppRole;
  setRole: (role: AppRole) => void;
  isWorkoutActive: boolean;
  setWorkoutActive: (active: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeRole: "member",
  setRole: (role) => set({ activeRole: role }),
  isWorkoutActive: false,
  setWorkoutActive: (active) => set({ isWorkoutActive: active }),
}));

// ─── Runtime Store ──────────────────────────────────────

import type { RuntimeConfig } from "./runtime";

interface RuntimeStore {
  config: RuntimeConfig | null;
  setConfig: (config: RuntimeConfig) => void;
}

export const useRuntimeStore = create<RuntimeStore>()((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
