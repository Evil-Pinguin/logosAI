import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Speaker, Sparkles } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { speak } from '@/lib/speech'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Exercise } from '@/lib/types'

interface ExcludeExerciseProps {
  exercise: Extract<Exercise, { type: 'exclude' }>
}

export function ExcludeExercise({ exercise }: ExcludeExerciseProps) {
  const { nextStep, loseLife, addScore } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    speak(exercise.instruction)
  }, [exercise.instruction])

  const handleCardClick = (index: number) => {
    if (selectedIndex !== null) return

    speak(exercise.options[index].audioText)
    setSelectedIndex(index)

    const isCorrect = index === exercise.oddOneOutIndex

    if (isCorrect) {
      addScore(20)
      speak(exercise.reason)
      setTimeout(() => {
        nextStep()
      }, 2000)
    } else {
      loseLife()
    }
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Найдите лишнее</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-slate-500 mb-6 text-center">
          {exercise.instruction}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exercise.options.map((opt, index) => {
            const selected = selectedIndex === index
            const isOdd = index === exercise.oddOneOutIndex
            const revealed = selectedIndex !== null

            let variantClass = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-sm'
            if (revealed && isOdd) {
              variantClass = 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }
            if (revealed && selected && !isOdd) {
              variantClass = 'bg-rose-50 border-rose-200 text-rose-700'
            }

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={revealed}
                onClick={() => handleCardClick(index)}
                className={`
                  flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-200
                  ${variantClass}
                `}
              >
                <img
                  src={opt.imageUrl}
                  alt={opt.label || ''}
                  className="w-24 h-24 object-contain rounded-lg shadow-sm mb-2"
                  loading="lazy"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.src = 'https://api.dicebear.com/7.x/notionists/svg?seed=odd'
                  }}
                />
                <Speaker
                  className={`h-5 w-5 ${
                    selected ? 'text-indigo-600' : 'text-slate-400'
                  } cursor-pointer hover:text-indigo-600`}
                  onClick={(e) => {
                    e.stopPropagation()
                    speak(opt.audioText)
                  }}
                />
                {opt.label && <span className="text-xs font-medium">{opt.label}</span>}

                {revealed && (
                  <div className={`mt-2 h-6 w-6 rounded-full flex items-center justify-center ${
                    isOdd ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {isOdd ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {selectedIndex !== null && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6 rounded-xl border bg-indigo-50 p-5 text-indigo-700 border-indigo-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {selectedIndex === exercise.oddOneOutIndex
                      ? 'Верно! Почему это лишнее?'
                      : 'Неправильно. Правильный ответ:'}
                  </p>
                  <p className="text-sm mt-1">{exercise.reason}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {selectedIndex !== null && selectedIndex === exercise.oddOneOutIndex && (
          <div className="mt-6 flex justify-end">
            <Button
              disabled
              onClick={() => nextStep()}
              className="flex items-center gap-2"
            >
              Далее
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
