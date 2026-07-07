"use client"

import { useState, useEffect, useCallback } from "react"
import { useLearning } from "@/hooks/use-learning"
import type { Question, SessionResult, SessionMode } from "@/lib/models"
import OnboardingScreen from "@/components/onboarding-screen"
import AppShell from "@/components/app-shell"
import HomeScreen from "@/components/home-screen"
import PracticeScreen from "@/components/practice-screen"
import ProgressScreen from "@/components/progress-screen"
import ProfileScreen from "@/components/profile-screen"
import SessionScreen from "@/components/session-screen"
import ResultScreen from "@/components/result-screen"

type View =
  | { type: "app" }
  | { type: "session"; mode: SessionMode; questions: Question[] }
  | { type: "result"; result: SessionResult }

export default function Home() {
  const {
    appState,
    schools,
    learningSnapshot,
    setLearnerPath,
    setGoal,
    setSelectedSchoolId,
    setIsOnboarded,
    setSelectedTab,
    startSession,
    storeSessionResult,
    resetOnboarding,
    login,
    logout,
  } = useLearning()

  const [view, setView] = useState<View>({ type: "app" })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStartQuickPractice = useCallback(
    (count: number) => {
      const questions = startSession("quickPractice", count)
      if (questions.length > 0) {
        setView({ type: "session", mode: "quickPractice", questions })
      }
    },
    [startSession],
  )

  const handleStartOfficialTest = useCallback(() => {
    const questions = startSession("officialTest", 10)
    if (questions.length > 0) {
      setView({ type: "session", mode: "officialTest", questions })
    }
  }, [startSession])

  const handleStartTopicPractice = useCallback(() => {
    const questions = startSession("topicPractice", 6, learningSnapshot.topicMetrics[0]?.topic)
    if (questions.length > 0) {
      setView({ type: "session", mode: "topicPractice", questions })
    }
  }, [startSession, learningSnapshot.topicMetrics])

  const handleStartWeakPractice = useCallback(() => {
    const questions = startSession("weakTopicPractice", 6)
    if (questions.length > 0) {
      setView({ type: "session", mode: "weakTopicPractice", questions })
    }
  }, [startSession])

  const handleStartMistakeReview = useCallback(() => {
    const questions = startSession("mistakeReview", 6)
    if (questions.length > 0) {
      setView({ type: "session", mode: "mistakeReview", questions })
    }
  }, [startSession])

  const handleStartRememberMode = useCallback(() => {
    const questions = startSession("rememberMode", 8)
    if (questions.length > 0) {
      setView({ type: "session", mode: "rememberMode", questions })
    }
  }, [startSession])

  const handleStartImagePractice = useCallback(() => {
    const questions = startSession("imagePractice", 6)
    if (questions.length > 0) {
      setView({ type: "session", mode: "imagePractice", questions })
    }
  }, [startSession])

  const handleStartMockExam = useCallback(() => {
    const questions = startSession("mockExam", 10)
    if (questions.length > 0) {
      setView({ type: "session", mode: "mockExam", questions })
    }
  }, [startSession])

  const handleSessionComplete = useCallback(
    (result: SessionResult) => {
      storeSessionResult(result)
      setView({ type: "result", result })
    },
    [storeSessionResult],
  )

  const handleReviewRetry = useCallback(
    (answers: Array<{ questionId: string; prompt: string; choices: string[]; correctIndex: number; shortExplanation: string; longExplanation: string; topic: string; commonMistakeReason: string }>) => {
      const questions: Question[] = answers.map((a) => ({
        id: a.questionId,
        prompt: a.prompt,
        choices: a.choices,
        correctIndex: a.correctIndex,
        shortExplanation: a.shortExplanation,
        longExplanation: a.longExplanation,
        topic: a.topic,
        commonMistakeReason: a.commonMistakeReason,
        difficulty: "standard",
        sourceType: "Review",
        tags: [],
        premiumOnly: false,
        sourceGroup: "main",
        subtopic: "",
      }))
      if (questions.length > 0) {
        setView({ type: "session", mode: "mistakeReview", questions })
      }
    },
    [],
  )

  const handleGoHome = useCallback(() => {
    setView({ type: "app" })
  }, [])

  const handlePracticeNow = useCallback(() => {
    handleStartQuickPractice(5)
  }, [handleStartQuickPractice])

  if (!mounted) {
    return <div className="min-h-dvh bg-surface" />
  }

  // --- Session view ---
  if (view.type === "session") {
    return (
      <SessionScreen
        mode={view.mode}
        questions={view.questions}
        onComplete={handleSessionComplete}
        onBack={handleGoHome}
      />
    )
  }

  // --- Result view ---
  if (view.type === "result") {
    return (
      <ResultScreen
        result={view.result}
        onReviewRetry={handleReviewRetry}
        onGoHome={handleGoHome}
      />
    )
  }

  // --- Onboarding ---
  if (!appState.isOnboarded) {
    return (
      <OnboardingScreen
        learnerPath={appState.learnerPath}
        goal={appState.goal}
        schools={schools}
        selectedSchool={appState.selectedSchool}
        onLearnerPathChanged={setLearnerPath}
        onGoalChanged={setGoal}
        onSchoolChanged={setSelectedSchoolId}
        onStart={() => setIsOnboarded(true)}
      />
    )
  }

  // --- App Shell with Tabs ---
  return (
    <AppShell
      selectedTab={appState.selectedTab}
      onSelectTab={setSelectedTab}
      homeScreen={
        <HomeScreen
          isLoggedIn={appState.isLoggedIn}
          onLoginClick={() => setSelectedTab(3)}
          goal={appState.goal}
          membershipPlan={appState.membershipPlan}
          paymentsEnabled={false}
          selectedSchool={appState.selectedSchool}
          sessionHistory={appState.sessionHistory}
          learningSnapshot={learningSnapshot}
          onPracticeNow={handlePracticeNow}
          onMockExam={handleStartMockExam}
          onReviewMistakes={handleStartMistakeReview}
        />
      }
      practiceScreen={
        <PracticeScreen
          membershipPlan={appState.membershipPlan}
          paymentsEnabled={false}
          heldBackQuestionCount={0}
          questionBank={[]}
          officialTestBank={[]}
          learningSnapshot={learningSnapshot}
          onQuickPractice={handleStartQuickPractice}
          onOfficialTest={handleStartOfficialTest}
          onTopicPractice={handleStartTopicPractice}
          onWeakPractice={handleStartWeakPractice}
          onMistakeReview={handleStartMistakeReview}
          onRememberMode={handleStartRememberMode}
          onImagePractice={handleStartImagePractice}
          onMockExam={handleStartMockExam}
        />
      }
      progressScreen={
        <ProgressScreen
          isLoggedIn={appState.isLoggedIn}
          onLoginClick={() => setSelectedTab(3)}
          membershipPlan={appState.membershipPlan}
          sessionHistory={appState.sessionHistory}
          learningSnapshot={learningSnapshot}
        />
      }
      profileScreen={
        <ProfileScreen
          isLoggedIn={appState.isLoggedIn}
          onLogin={login}
          onLogout={logout}
          learnerPath={appState.learnerPath}
          goal={appState.goal}
          membershipPlan={appState.membershipPlan}
          paymentsEnabled={false}
          school={appState.selectedSchool}
          readinessScore={learningSnapshot.readinessScore}
          onResetOnboarding={resetOnboarding}
        />
      }
    />
  )
}
