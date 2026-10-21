import { useEffect } from 'react'
import { CheckCircle2, Play, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { speak } from '@/lib/speech'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { LessonContent } from '@/lib/types'

interface PecsScreenProps {
  lesson: LessonContent
}

export function PecsScreen({ lesson }: PecsScreenProps) {
  const { nextStep } = useGameStore()

  // Автоматически озвучиваем каждое расписание по порядку
  useEffect(() => {
    let i = 0
    const speakNext = () => {
      if (i < lesson.pecsSchedule.length) {
        speak(lesson.pecsSchedule[i].audioText)
        i++
        setTimeout(speakNext, 2200)
      }
    }
    speakNext()
  }, [lesson.pecsSchedule])

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Визуальное расписание (PECS)</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Посмотрите, что нас ждёт на занятии
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lesson.pecsSchedule.map((item, index) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-slate-200 bg-white"
            >
              <div
                className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg mb-1"
              >
                {index + 1}
              </div>
              <img
                src={item.imageUrl}
                alt={item.label}
                className="w-24 h-24 object-contain rounded-lg shadow-sm mb-2"
                loading="lazy"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.src = 'https://api.dicebear.com/7.x/notionists/svg?seed=pecs'
                }}
              />
              <Play
                className="h-5 w-5 text-slate-400 cursor-pointer hover:text-indigo-600"
                onClick={(e) => {
                  e.stopPropagation()
                  speak(item.audioText)
                }}
              />
              <span className="text-sm font-medium text-slate-700 text-center leading-tight">
                {item.label}
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => nextStep()}
            className="flex items-center gap-2 w-48"
          >
            Начать игру <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
