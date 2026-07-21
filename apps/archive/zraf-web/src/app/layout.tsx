import type { Metadata } from "next"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LearningProvider } from "@/hooks/use-learning"

export const metadata: Metadata = {
  title: "ZRAf - Driving Theory Prep",
  description:
    "Pass the Mongolian driving theory exam faster with visuals, mock exams, and focused drills.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh font-sans text-ink antialiased">
        <div className="w-full max-w-lg mx-auto min-h-dvh bg-surface dark:bg-card border-x border-mist/40 dark:border-border/10 shadow-xl relative flex flex-col">
          <TooltipProvider>
            <LearningProvider>{children}</LearningProvider>
          </TooltipProvider>
        </div>
      </body>
    </html>
  )
}
