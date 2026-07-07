"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import type {
  AppState,
  Question,
  SessionResult,
  SessionMode,
  LearningSnapshot,
  LearnerPath,
  LearningGoal,
  MembershipPlan,
  SchoolPartner,
} from "@/lib/models"
import {
  questionBank as hcQuestionBank,
  officialTestBank as hcOfficialTestBank,
  schools,
} from "@/lib/question-bank"
import { buildSnapshot, buildQuestionsForMode } from "@/lib/learning-engine"
import { loadState, saveState, clearState } from "@/lib/storage"
import {
  loadQuestionIndex,
  loadCategoryQuestions,
  loadOfficialTests,
  rawToQuestion,
  rawOfficialToQuestion,
  type QuestionData,
} from "@/lib/data-loader"

interface LearningContextType {
  appState: AppState
  questionBank: Question[]
  officialTestBank: Question[]
  schools: SchoolPartner[]
  learningSnapshot: LearningSnapshot
  catalogLoading: boolean
  catalogError: string | null
  setLearnerPath: (path: LearnerPath) => void
  setGoal: (goal: LearningGoal) => void
  setMembershipPlan: (plan: MembershipPlan) => void
  setSelectedSchoolId: (id: string) => void
  setIsOnboarded: (v: boolean) => void
  setSelectedTab: (index: number) => void
  startSession: (mode: SessionMode, count: number, topic?: string) => Question[]
  storeSessionResult: (result: SessionResult) => void
  resetOnboarding: () => void
  login: () => void
  logout: () => void
}

const LearningContext = createContext<LearningContextType | null>(null)

function cleanVisual(visual?: { kind: string; title: string; caption: string; assetPath?: string }) {
  if (!visual) return undefined
  let title = visual.title || ""
  let caption = visual.caption || ""
  
  const lowerTitle = title.toLowerCase()
  const lowerCaption = caption.toLowerCase()
  
  if (
    lowerTitle.includes("traffic institute") ||
    (lowerTitle.includes("асуулт") && lowerTitle.includes("зураг")) ||
    lowerTitle.includes("apk")
  ) {
    title = ""
  }
  
  if (
    lowerCaption.includes("traffic institute") ||
    lowerCaption.includes("эх apk") ||
    lowerCaption.includes("зургийн асуулт") ||
    lowerCaption.includes("экспортлов")
  ) {
    caption = ""
  }
  
  if (!visual.assetPath && !title && !caption) {
    return undefined
  }
  
  return {
    kind: visual.kind as any,
    title,
    caption,
    assetPath: visual.assetPath,
  }
}

function toQuestion(qd: QuestionData): Question {
  const visual = qd.visual
    ? cleanVisual({
        kind: qd.visual.kind,
        title: qd.visual.title || "",
        caption: qd.visual.caption || "",
        assetPath: qd.visual.assetPath,
      })
    : undefined

  return {
    id: qd.id,
    prompt: qd.prompt,
    choices: qd.choices,
    correctIndex: qd.correctIndex,
    shortExplanation: qd.shortExplanation,
    longExplanation: qd.longExplanation,
    topic: qd.topic,
    subtopic: qd.subtopic,
    difficulty: qd.difficulty,
    sourceType: qd.sourceType,
    tags: qd.tags,
    commonMistakeReason: qd.commonMistakeReason,
    premiumOnly: qd.premiumOnly,
    sourceGroup: qd.sourceGroup,
    pack: qd.pack,
    visual,
  }
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>(() => ({
    isLoggedIn: false,
    learnerPath: "individual",
    goal: "passSoon",
    membershipPlan: "free",
    selectedSchool: null,
    isOnboarded: false,
    selectedTab: 0,
    sessionHistory: [],
  }))
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([])
  const [loadedOfficialTests, setLoadedOfficialTests] = useState<Question[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadState()
    const school = stored.selectedSchoolId
      ? schools.find((s) => s.id === stored.selectedSchoolId) ?? null
      : schools[0] ?? null
    setAppState((prev) => ({
      ...prev,
      isLoggedIn: stored.isLoggedIn,
      learnerPath: stored.learnerPath,
      goal: stored.goal,
      membershipPlan: stored.membershipPlan,
      selectedSchool: school,
      isOnboarded: stored.isOnboarded,
      sessionHistory: stored.sessionHistory,
    }))
  }, [])

  useEffect(() => {
    async function loadCatalog() {
      try {
        const index = await loadQuestionIndex()
        const officialRaw = await loadOfficialTests()
        const categoryCodes = [
          ...new Set(index.map((e) => e.categoryCode).filter(Boolean)),
        ]
        const categoryQuestions = await Promise.all(
          categoryCodes.map((code) => loadCategoryQuestions(code)),
        )
        const indexById = new Map(index.map((e) => [e.id, e]))
        const allLoaded: Question[] = []
        for (const catQ of categoryQuestions.flat()) {
          const idxEntry = indexById.get(catQ.id)
          if (!idxEntry) continue
          const qd = rawToQuestion(catQ, idxEntry)
          allLoaded.push(toQuestion(qd))
        }
        const officialLoaded = officialRaw.map((r) =>
          toQuestion(rawOfficialToQuestion(r)),
        )
        setLoadedQuestions(allLoaded)
        setLoadedOfficialTests(officialLoaded)
        setCatalogLoading(false)
      } catch (e) {
        console.error("Failed to load question catalog:", e)
        setCatalogError(String(e))
        setCatalogLoading(false)
      }
    }
    loadCatalog()
  }, [])

  useEffect(() => {
    if (appState.sessionHistory.length > 0 || appState.isOnboarded || appState.isLoggedIn) {
      saveState({
        isLoggedIn: appState.isLoggedIn,
        learnerPath: appState.learnerPath,
        goal: appState.goal,
        membershipPlan: appState.membershipPlan,
        selectedSchoolId: appState.selectedSchool?.id ?? null,
        isOnboarded: appState.isOnboarded,
        sessionHistory: appState.sessionHistory,
      })
    }
  }, [appState])

  const mergedQuestionBank = useMemo(() => {
    return loadedQuestions.length > 0 ? loadedQuestions : hcQuestionBank
  }, [loadedQuestions])

  const mergedOfficialTestBank = useMemo(() => {
    return loadedOfficialTests.length > 0
      ? loadedOfficialTests
      : hcOfficialTestBank
  }, [loadedOfficialTests])

  const learningSnapshot = useMemo(
    () =>
      buildSnapshot(
        [...mergedQuestionBank, ...mergedOfficialTestBank],
        appState.sessionHistory,
        appState.goal,
        appState.membershipPlan,
      ),
    [
      mergedQuestionBank,
      mergedOfficialTestBank,
      appState.sessionHistory,
      appState.goal,
      appState.membershipPlan,
    ],
  )

  const setLearnerPath = useCallback((learnerPath: LearnerPath) => {
    setAppState((prev) => ({ ...prev, learnerPath }))
  }, [])

  const setGoal = useCallback((goal: LearningGoal) => {
    setAppState((prev) => ({ ...prev, goal }))
  }, [])

  const setMembershipPlan = useCallback(
    (membershipPlan: MembershipPlan) => {
      setAppState((prev) => ({ ...prev, membershipPlan }))
    },
    [],
  )

  const setSelectedSchoolId = useCallback((id: string) => {
    const school = schools.find((s) => s.id === id) ?? null
    setAppState((prev) => ({ ...prev, selectedSchool: school }))
  }, [])

  const setIsOnboarded = useCallback((isOnboarded: boolean) => {
    setAppState((prev) => ({ ...prev, isOnboarded }))
  }, [])

  const setSelectedTab = useCallback((selectedTab: number) => {
    setAppState((prev) => ({ ...prev, selectedTab }))
  }, [])

  const startSession = useCallback(
    (mode: SessionMode, count: number, topic?: string): Question[] => {
      return buildQuestionsForMode(
        mode,
        count,
        mergedQuestionBank,
        mergedOfficialTestBank,
        appState.sessionHistory,
        learningSnapshot.topicMetrics,
        topic,
      )
    },
    [
      mergedQuestionBank,
      mergedOfficialTestBank,
      appState.sessionHistory,
      learningSnapshot.topicMetrics,
    ],
  )

  const storeSessionResult = useCallback((result: SessionResult) => {
    setAppState((prev) => ({
      ...prev,
      sessionHistory: [result, ...prev.sessionHistory].sort(
        (a, b) => b.completedAt - a.completedAt,
      ),
      selectedTab: 2,
    }))
  }, [])

  const resetOnboarding = useCallback(() => {
    clearState()
    setAppState({
      isLoggedIn: false,
      learnerPath: "individual",
      goal: "passSoon",
      membershipPlan: "free",
      selectedSchool: null,
      isOnboarded: false,
      selectedTab: 0,
      sessionHistory: [],
    })
  }, [])

  const login = useCallback(() => {
    setAppState((prev) => ({ ...prev, isLoggedIn: true }))
  }, [])

  const logout = useCallback(() => {
    setAppState((prev) => ({ ...prev, isLoggedIn: false }))
  }, [])

  return (
    <LearningContext.Provider
      value={{
        appState,
        questionBank: mergedQuestionBank,
        officialTestBank: mergedOfficialTestBank,
        schools,
        learningSnapshot,
        catalogLoading,
        catalogError,
        setLearnerPath,
        setGoal,
        setMembershipPlan,
        setSelectedSchoolId,
        setIsOnboarded,
        setSelectedTab,
        startSession,
        storeSessionResult,
        resetOnboarding,
        login,
        logout,
      }}
    >
      {children}
    </LearningContext.Provider>
  )
}

export function useLearning() {
  const ctx = useContext(LearningContext)
  if (!ctx) throw new Error("useLearning must be used within LearningProvider")
  return ctx
}
