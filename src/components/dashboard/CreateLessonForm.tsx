import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
/// <reference types="vite/client" />
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'

const formSchema = z.object({
  title: z.string().min(2, 'Минимум 2 символа'),
  lexicalTheme: z.string().min(2, 'Укажите лексическую тему'),
  difficultyLevel: z.enum(['low', 'medium', 'high']),
})

type FormValues = z.infer<typeof formSchema>

interface CreateLessonFormProps {
  onCreate: (lesson: {
    id: string
    title: string
    lexicalTheme: string
    difficultyLevel: string
    createdAt: string
  }) => void
}

export function CreateLessonForm({ onCreate }: CreateLessonFormProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormValues>({
    title: '',
    lexicalTheme: '',
    difficultyLevel: 'low',
  })

  const EDGE_FUNCTION_URL =
    (import.meta as any).env?.VITE_EDGE_FUNCTION_URL ||
    `${window.location.origin}/functions/v1/generate-lesson`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = formSchema.safeParse(form)
    if (!parsed.success) {
      setError('Проверьте заполнение полей')
      return
    }
    if (!user) {
      setError('Необходимо войти в аккаунт')
      return
    }

    setPending(true)
    try {
      // 1. Запрашиваем генерацию урока у Edge Function (LLM + Zod-валидация)
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: parsed.data.lexicalTheme,
          difficulty: parsed.data.difficultyLevel,
          title: parsed.data.title,
        }),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || 'Ошибка генерации урока')
      }

      const data = await res.json()
      const rawJson = data.lesson ?? data

      // 2. Сохраняем урок в таблицу lessons
      const { data: inserted, error: dbError } = await supabase
        .from('lessons')
        .insert({
          user_id: user.id,
          title: parsed.data.title,
          lexical_theme: parsed.data.lexicalTheme,
          difficulty_level: parsed.data.difficultyLevel,
          raw_json: rawJson,
        })
        .select()
        .single()

      if (dbError) throw dbError

      onCreate({
        id: inserted.id,
        title: parsed.data.title,
        lexicalTheme: parsed.data.lexicalTheme,
        difficultyLevel: parsed.data.difficultyLevel,
        createdAt: inserted.created_at,
      })
      setForm({ title: '', lexicalTheme: '', difficultyLevel: 'low' })
      setOpen(false)
    } catch (err: any) {
      setError(err.message || 'Не удалось создать урок')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-5 w-5" /> Создать новый урок
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-full max-w-md mx-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle>Новый интерактивный урок</CardTitle>
                <p className="text-sm text-slate-500">
                  Заполните параметры — содержимое сгенерирует нейросеть.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {error && (
                  <div className="rounded-lg bg-rose-50 p-3 text-rose-700 text-sm border border-rose-100">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Название урока
                    </label>
                    <input
                      className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="Например: Дикие животные"
                      disabled={pending}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Лексическая тема
                    </label>
                    <input
                      className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      value={form.lexicalTheme}
                      onChange={(e) =>
                        setForm({ ...form, lexicalTheme: e.target.value })
                      }
                      placeholder="Например: Домашние животные, еда, транспорт"
                      disabled={pending}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Уровень сложности
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <Button
                          key={level}
                          variant={
                            form.difficultyLevel === level ? 'primary' : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            setForm({ ...form, difficultyLevel: level })
                          }
                        >
                          {level === 'low'
                            ? 'Низкий'
                            : level === 'medium'
                            ? 'Средний'
                            : 'Высокий'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={pending}
                    >
                      Отмена
                    </Button>
                    <Button type="submit" disabled={pending} className="w-40">
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Генерировать урок
                    </Button>
                  </div>
                </form>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
