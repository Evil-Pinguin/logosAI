import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Speaker } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { speak } from '@/lib/speech'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Exercise } from '@/lib/types'

interface ChoiceExerciseProps {
  exercise: Extract<Exercise, { type: 'choice' }>
}

export function ChoiceExercise({ exercise }: ChoiceExerciseProps) {
  const { nextStep, loseLife, addScore } = useGameStore()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [locked, setLocked] = useState(false)

  // Озвучиваем инструкцию при входе
  useEffect(() => {
    speak(exercise.instruction)
  }, [exercise.instruction])

  const handleCardClick = (index: number) => {
    if (locked || selectedIndex !== null) return

    // Озвучиваем текст карточки при клике
    speak(exercise.options[index].audioText)

    const correct = index === exercise.correctAnswerIndex
    setSelectedIndex(index)
    setIsCorrect(correct)
    setLocked(true)

    if (correct) {
      addScore(20)
      // Автопереход через 1.5 секунды
      setTimeout(() => {
        nextStep()
      }, 1500)
    } else {
      loseLife()
    }
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Выберите правильный вариант</CardTitle>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Этап {exercise.instruction.length > 0 ? '2' : '1'}
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-slate-500 mb-6 text-center">
          {exercise.instruction}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercise.options.map((opt, index) => {
            const selected = selectedIndex === index
            const correct = index === exercise.correctAnswerIndex
            const revealed = selectedIndex !== null

            let variantClass = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-sm'
            if (revealed && correct) {
              variantClass = 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }
            if (revealed && selected && !correct) {
              variantClass = 'bg-rose-50 border-rose-200 text-rose-700'
            }

            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={locked || revealed}
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
                    t.src = 'https://api.dicebear.com/7.x/notionists/svg?seed=choice'
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

                {revealed && selected && (
                  <div className={`mt-2 h-6 w-6 rounded-full flex items-center justify-center ${
                    correct ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {correct ? (
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

        {selectedIndex !== null && !isCorrect && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 rounded-lg bg-rose-50 p-3 text-rose-700 text-sm border border-rose-100 flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Неправильно. Осталось жизней: {useGameStore.getState().lives}
            </motion.div>
          </AnimatePresence>
        )}

        {selectedIndex !== null && isCorrect && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-700 text-sm border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Верно! Переход к следующему заданию…
          </div>
        )}
      </CardContent>
    </Card>
  )
}
