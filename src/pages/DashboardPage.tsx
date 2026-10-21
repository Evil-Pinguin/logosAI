import { useState, useEffect, useCallback } from 'react'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LessonCard } from '@/components/dashboard/LessonCard'
import { CreateLessonForm } from '@/components/dashboard/CreateLessonForm'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Lesson } from '@/lib/types'

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [pending, setPending] = useState(false)

  const mapLesson = (row: any): Lesson => ({
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    title: row.title,
    lexicalTheme: row.lexical_theme,
    difficultyLevel: row.difficulty_level,
    rawJson: row.raw_json,
  })

  const loadLessons = useCallback(async () => {
    if (!user) return
    setPending(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLessons((data ?? []).map(mapLesson))
    } catch (err: any) {
      console.error(err)
    } finally {
      setPending(false)
    }
  }, [user])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const handleCreate = (lesson: {
    id: string
    title: string
    lexicalTheme: string
    difficultyLevel: string
    createdAt: string
  }) => {
    setLessons((prev) => [
      {
        ...lesson,
        userId: user?.id ?? '',
        rawJson: {} as any,
      } as Lesson,
      ...prev,
    ])
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              L
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">LogosAI</h1>
              <p className="text-xs text-slate-500">
                Дашборд логопеда • интерактивные уроки
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-sm text-slate-600">
              <User className="h-4 w-4" />
              {profile?.fullName || 'Пользователь'}
            </div>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Мои уроки</h2>
            <p className="text-slate-500">
              Создавайте интерактивные занятия для детей с особенностями развития
            </p>
          </div>
          <CreateLessonForm onCreate={handleCreate} />
        </div>

        <Card>
          <CardHeader className="flex justify-between items-start">
            <div>
              <CardTitle>Список уроков</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Карточки с лексическими темами и уровнем сложности
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500">
              {lessons.length} уроков
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            {pending && (
              <div className="h-64 flex items-center justify-center">
                <span className="text-slate-400">Загрузка уроков...</span>
              </div>
            )}
            {lessons.length === 0 && !pending && (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <p>Уроков пока нет. Создайте первый урок.</p>
              </div>
            )}
            {lessons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
