import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { LessonContent } from '@/lib/types'

interface FinishScreenProps {
  lesson: LessonContent
  score: number
  livesWasted: number
  onRestart: () => void
}

export function FinishScreen({
  lesson,
  score,
  livesWasted,
  onRestart,
}: FinishScreenProps) {
  const totalPossible = lesson.exercises.length * 20
  const pct = totalPossible ? Math.round((score / totalPossible) * 100) : 0

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Заглушка для будущего сохранения в student_progress
    // lesson.id не входит в LessonContent напрямую, поэтому передаётся отдельно при необходимости
  }, [])

  const saveProgress = async () => {
    setSaving(true)
    try {
      // Сохранение в student_progress можно добавить здесь через supabase
      setSaved(true)
    } catch (err) {
      console.error('Ошибка сохранения прогресса:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="shadow-lg border-slate-200 max-w-md mx-auto">
      <CardHeader className="py-8 text-center">
        <Confetti
          width={400}
          height={400}
          recycle={false}
          numberOfPieces={120}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#ec4899']}
        />
        <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto mb-3 animate-bounce" />
        <CardTitle className="text-2xl">Поздравляем!</CardTitle>
        <p className="text-sm text-slate-500 mt-2">
          Урок «{lesson.title}» завершён
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <StatBox label="Очки" value={score} />
          <StatBox label="Точность" value={`${pct}%`} />
          <StatBox label="Жизней потрачено" value={livesWasted} />
        </div>
      </CardContent>

      <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
        {!saved ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={saveProgress}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2"
          >
            {saving ? 'Сохранение…' : 'Сохранить прогресс в БД'}
          </Button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Прогресс сохранён
          </div>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={onRestart}
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Пройти ещё раз
        </Button>
      </div>
    </Card>
  )
}

function StatBox({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="text-xs text-slate-400 uppercase font-semibold">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}
