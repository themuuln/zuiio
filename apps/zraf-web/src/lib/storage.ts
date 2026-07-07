import type { SessionResult, LearnerPath, LearningGoal, MembershipPlan } from "./models"

const STORAGE_KEY = "zraf_state"

interface StoredState {
  isLoggedIn: boolean
  learnerPath: LearnerPath
  goal: LearningGoal
  membershipPlan: MembershipPlan
  selectedSchoolId: string | null
  isOnboarded: boolean
  sessionHistory: SessionResult[]
}

const defaultState: StoredState = {
  isLoggedIn: false,
  learnerPath: "individual",
  goal: "passSoon",
  membershipPlan: "free",
  selectedSchoolId: null,
  isOnboarded: false,
  sessionHistory: [],
}

export function loadState(): StoredState {
  if (typeof window === "undefined") return { ...defaultState }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  } catch {
    return { ...defaultState }
  }
}

export function saveState(state: StoredState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
