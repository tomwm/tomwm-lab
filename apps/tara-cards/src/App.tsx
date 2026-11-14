import { Route, Routes } from 'react-router-dom'
import { Nav } from '@/ui/Nav'
import { useApp } from '@/app/AppContext'
import { Loading } from '@/ui/primitives'
import { TodayPage } from '@/features/today/TodayPage'
import { LibraryPage } from '@/features/library/LibraryPage'
import { ComponentPage } from '@/features/library/ComponentPage'
import { SkillPage } from '@/features/library/SkillPage'
import { QuestionPage } from '@/features/library/QuestionPage'
import { SourcesPage } from '@/features/library/SourcesPage'
import { PracticePage } from '@/features/practice/PracticePage'
import { SessionPage } from '@/features/practice/SessionPage'
import { SessionSummaryPage } from '@/features/practice/SessionSummaryPage'
import { WritingPage } from '@/features/writing/WritingPage'
import { EssayPage } from '@/features/writing/EssayPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { CoveragePage } from '@/features/settings/CoveragePage'

export default function App() {
  const { ready } = useApp()

  return (
    <div className="flex min-h-dvh bg-background">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main" className="min-w-0 flex-1 pb-20 md:pb-10">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {!ready ? (
            <Loading label="Opening your study data" />
          ) : (
            <Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/sources" element={<SourcesPage />} />
              <Route path="/library/component/:componentId" element={<ComponentPage />} />
              <Route path="/library/skill/:skillId" element={<SkillPage />} />
              <Route path="/library/question/:questionId" element={<QuestionPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/practice/session/:sessionId" element={<SessionPage />} />
              <Route path="/practice/summary/:sessionId" element={<SessionSummaryPage />} />
              <Route path="/writing" element={<WritingPage />} />
              <Route path="/writing/essay/:essayId" element={<EssayPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/coverage" element={<CoveragePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </div>
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        That address does not match anything in the app.
      </p>
    </div>
  )
}
