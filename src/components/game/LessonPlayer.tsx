import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Trophy, ArrowLeft, Play } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { speak, stopSpeaking } from '@/lib/speech'
import { PecsScreen } from '@/components/game/screens/PecsScreen'
import { FinishScreen } from '@/components/game/screens/FinishScreen'
import { ExerciseZone } from '@/components/game/zones/ExerciseZone'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'

export function LessonPlayer() {
  const {
    currentLesson,
    currentStep,
    lives,
    score,
    isGameOver,
    isCompleted,
    resetGame,
  } = useGameStore()

  if (!currentLesson) return null

  // Автоозвучка при входе на новый экран
  useEffect(() => {
    if (currentStep === -1) {
      speak(
        `Добро пожаловать на занятие "${currentLesson.title}". Давайте начнём с визуального расписания.`
      )
    }
  }, [currentStep, currentLesson?.title])

  useEffect(() => {
    if (isGameOver) {
      stopSpeaking()
      speak('Жизни закончились. Попробуйте пройти урок ещё раз.')
    }
  }, [isGameOver])

  const totalSteps = 1 + currentLesson.exercises.length
  const completed = isCompleted
    ? totalSteps
    : Math.max(0, currentStep + 1)
  const pct = Math.round((completed / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Хедер с прогрессом и жизнями */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-slate-400 cursor-pointer hover:text-slate-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {currentLesson.title}
              </h2>
              <p className="text-sm text-slate-500">
                {currentLesson.lexicalTheme}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Жизни</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`h-5 w-5 transition-transform duration-200 ${
                    i < lives
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">{score}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Прогресс занятия</span>
            <span>{pct}%</span>
          </div>
          <ProgressBar value={pct} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Экран финиша */}
          {isCompleted && (
            <motion.div
              key="finish"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FinishScreen
                lesson={currentLesson}
                score={score}
                livesWasted={3 - lives}
                onRestart={resetGame}
              />
            </motion.div>
          )}

          {/* Экран Game Over */}
          {isGameOver && !isCompleted && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <Play className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Попробуйте ещё раз
                </h2>
                <p className="text-slate-500 mb-6">
                  Жизни закончились. Вы можете начать урок заново.
                </p>
                <Button variant="outline" onClick={resetGame} className="w-48">
                  Начать заново
                </Button>
              </div>
            </motion.div>
          )}

          {!isCompleted && !isGameOver && (
            <>
              {currentStep === -1 ? (
                <motion.div
                  key="pecs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <PecsScreen lesson={currentLesson} />
                </motion.div>
              ) : (
                <motion.div
                  key={`exercise-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ExerciseZone />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
