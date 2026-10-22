import { Link } from 'react-router-dom'
import { Clock, HardHat } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Lesson } from '@/lib/types'

const difficultyLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Низкий', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Средний', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: 'Высокий', color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

interface LessonCardProps {
  lesson: Lesson
}

export function LessonCard({ lesson }: LessonCardProps) {
  const style = difficultyLabels[lesson.difficultyLevel] ?? difficultyLabels.low
  return (
    <motion.div
      layoutId={`lesson-${lesson.id}`}
      whileHover={{ y: -4 }}
      className="cursor-pointer group"
    >
      <Card className="hover:shadow-md transition-shadow border-slate-100 group-hover:border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg">{lesson.title}</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${style.color}`}
            >
              {style.label}
            </span>
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(
                lesson.createdAt,
              ).toLocaleDateString('ru-RU')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Тема: {lesson.lexicalTheme}
          </p>
        </CardHeader>
        <CardContent className="flex justify-end gap-2 pt-4">
          <Link to={`/game/${lesson.id}`}>
            <Button variant="outline" size="sm">
              Открыть урок <HardHat className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
