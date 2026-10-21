import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import type { LessonSchemaType } from '@/lib/lessonSchema'

const EDGE_FUNCTION_URL =
  (import.meta as any).env?.VITE_EDGE_FUNCTION_URL ||
  `${window.location.origin}/functions/v1/generate-lesson`

/**
 * lessonService — сервис для работы с генерацией уроков через AI.
 * Вызывает Edge Function, сохраняет результат в Zustand-стор и запускает игру.
 */
export const lessonService = {
  /**
   * Генерирует урок через Supabase Edge Function.
   * Урок сохраняется в таблицу lessons бэкендом, а на фронтенд возвращается
   * валидированный объект lesson, который сразу подаётся в игровой стор.
   *
   * @param params.lexicalTheme — лексическая тема урока
   * @param params.difficultyLevel — уровень сложности (low | medium | high)
   * @param params.title — optional, заголовок урока
   */
  async generateLesson(params: {
    lexicalTheme: string
    difficultyLevel: 'low' | 'medium' | 'high'
    title?: string
  }): Promise<{ id: string; lesson: LessonSchemaType }> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      throw new Error('Пользователь не авторизован. Войдите в аккаунт.')
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        lexical_theme: params.lexicalTheme,
        difficulty_level: params.difficultyLevel,
        title: params.title || `Занятие: ${params.lexicalTheme}`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(
        `Ошибка Edge Function (${response.status}): ${errorText || response.statusText}`,
      )
    }

    const data = await response.json()
    if (!data || !data.lesson || !data.id) {
      throw new Error('Некорректный ответ от сервера генерации')
    }

    /* ---------- Запуск игры: передаём урок в Zustand-стор ---------- */
    useGameStore.getState().startLesson(data.lesson as any)

    return { id: data.id, lesson: data.lesson as LessonSchemaType }
  }
}
