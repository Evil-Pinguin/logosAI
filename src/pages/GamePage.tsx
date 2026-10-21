import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useGameStore } from '@/store/gameStore'
import { LessonPlayer } from '@/components/game/LessonPlayer'
import { validateLessonContent } from '@/lib/zodSchemas'
import { supabase } from '@/lib/supabase'

export default function GamePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { startLesson } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single()

        if (dbError) throw dbError
        if (!data) throw new Error('Урок не найден')

        const rawJson = data.raw_json as unknown
        const validation = validateLessonContent(rawJson)
        if (!validation.success) {
          throw new Error(
            'Структура урока не прошла валидацию: ' +
              validation.error.issues.map((i) => i.message).join('; '),
          )
        }

        if (!cancelled) {
          startLesson(validation.data as any)
          setLoading(false)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Не удалось загрузить урок')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [lessonId, startLesson])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Загрузка урока...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <a
            href="/dashboard"
            className="text-indigo-600 hover:underline text-sm"
          >
            Вернуться к дашборду
          </a>
        </div>
      </div>
    )
  }

  return <LessonPlayer />
}
