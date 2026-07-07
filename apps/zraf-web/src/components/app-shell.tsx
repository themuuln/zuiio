"use client"

import { useState, useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { House, BookOpenText, ChartBar, User } from "@phosphor-icons/react"

interface AppShellProps {
  selectedTab: number
  onSelectTab: (index: number) => void
  homeScreen: ReactNode
  practiceScreen: ReactNode
  progressScreen: ReactNode
  profileScreen: ReactNode
}

const tabs = [
  { label: "Home", icon: House },
  { label: "Practice", icon: BookOpenText },
  { label: "Progress", icon: ChartBar },
  { label: "Profile", icon: User },
]

const tabTitles = ["Home", "Practice", "Progress", "Profile"]

export default function AppShell({
  selectedTab,
  onSelectTab,
  homeScreen,
  practiceScreen,
  progressScreen,
  profileScreen,
}: AppShellProps) {
  const screens = [homeScreen, practiceScreen, progressScreen, profileScreen]
  const [prevTab, setPrevTab] = useState(selectedTab)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (prevTab !== selectedTab) {
      setPrevTab(selectedTab)
      setAnimKey((k) => k + 1)
    }
  }, [selectedTab, prevTab])

  return (
    <div className="min-h-dvh bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-mist/30 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <span className="text-sm font-bold tracking-tight text-teal font-display">
            ZRAf
          </span>
          <span className="text-sm font-bold text-ink">{tabTitles[selectedTab]}</span>
          <span className="w-12" />
        </div>
      </header>

      {/* Scrollable content */}
      <main key={animKey} className="pb-24 animate-fade-in">
        {screens[selectedTab]}
      </main>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full z-20 bg-white/85 backdrop-blur-xl border-t border-mist/60 px-3 pb-[max(env(safe-area-inset-bottom,0.75rem),0.75rem)] pt-2">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab, i) => {
            const isActive = selectedTab === i
            const Icon = tab.icon
            return (
              <button
                key={tab.label}
                onClick={() => onSelectTab(i)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer",
                  "hover:bg-teal/5",
                  isActive && "bg-teal/8",
                )}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-teal animate-scale-in" />
                )}
                <Icon
                  size={22}
                  weight={isActive ? "fill" : "regular"}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-teal" : "text-stone",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors duration-200",
                    isActive ? "text-teal" : "text-stone",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
