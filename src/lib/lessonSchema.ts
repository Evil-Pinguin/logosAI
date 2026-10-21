import { z } from 'zod'

/**
 * lessonSchema — строгая Zod-схема для валидации JSON-ответа LLM
 * перед сохранением в таблицу lessons и отправкой на фронтенд.
 * Соответствует TypeScript-интерфейсам из src/lib/types.ts.
 */

const exerciseAssetSchema = z.object({
  /** URL картинки (PECS-карточка или иллюстрация) */
  imageUrl: z.string().url('Некорректный URL картинки'),
  /** Текст, который озвучивается через Web Speech API */
  audioText: z.string().min(1, 'audioText не может быть пустым').max(200),
  /** Подпись под карточкой (опционально) */
  label: z.string().max(50).optional(),
})

/* ---------- choice ---------- */
export const choiceExerciseSchema = z.object({
  id: z.string().uuid('id должен быть UUID'),
  type: z.literal('choice'),
  instruction: z.string().min(1, 'Инструкция обязательна'),
  options: z.array(exerciseAssetSchema).min(2).max(6, 'от 2 до 6 вариантов'),
  correctAnswerIndex: z
    .number()
    .int()
    .min(0)
    .max(5, 'индекс вне диапазона options'),
})

/* ---------- match ---------- */
export const matchExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('match'),
  instruction: z.string().min(1),
  left: z.array(exerciseAssetSchema).min(2).max(5),
  right: z.array(exerciseAssetSchema).min(2).max(5),
  pairs: z.array(
    z.object({
      leftIndex: z.number().int().min(0),
      rightIndex: z.number().int().min(0),
    }),
  ),
})

/* ---------- sequence ---------- */
export const sequenceExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('sequence'),
  instruction: z.string().min(1),
  items: z.array(exerciseAssetSchema).length(3, 'ровно 3 карточки'),
  correctOrder: z.array(z.string().uuid()).length(3),
})

/* ---------- exclude ---------- */
export const excludeExerciseSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('exclude'),
  instruction: z.string().min(1),
  options: z.array(exerciseAssetSchema).length(4, 'ровно 4 карточки'),
  oddOneOutIndex: z.number().int().min(0).max(3),
  reason: z.string().min(1, 'нужно текстовое объяснение reason'),
})

/* ---------- PECS schedule item ---------- */
export const pecsScheduleItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(50),
  imageUrl: z.string().url(),
  audioText: z.string().min(1).max(200),
  done: z.boolean().default(false),
})

/* ---------- lesson (корневая схема) ---------- */
export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  lexicalTheme: z.string().min(1).max(100),
  difficultyLevel: z.enum(['low', 'medium', 'high']),
  pecsSchedule: z
    .array(pecsScheduleItemSchema)
    .min(1)
    .max(8, 'максимум 8 карточек расписания'),
  exercises: z
    .array(
      z.discriminatedUnion('type', [
        choiceExerciseSchema,
        matchExerciseSchema,
        sequenceExerciseSchema,
        excludeExerciseSchema,
      ]),
    )
    .min(1)
    .max(10, 'максимум 10 упражнений'),
})

/* ---------- exported types ---------- */
export type LessonSchemaType = z.infer<typeof lessonSchema>
export type ChoiceExerciseSchemaType = z.infer<typeof choiceExerciseSchema>
export type MatchExerciseSchemaType = z.infer<typeof matchExerciseSchema>
export type SequenceExerciseSchemaType = z.infer<typeof sequenceExerciseSchema>
export type ExcludeExerciseSchemaType = z.infer<typeof excludeExerciseSchema>
export type PecsScheduleItemSchemaType = z.infer<typeof pecsScheduleItemSchema>

/**
 * Валидирует необработанный объект (например, после JSON.parse ответа LLM).
 * Возвращает типизированный объект или выбрасывает ZodError.
 */
export function validateLesson(data: unknown): LessonSchemaType {
  return lessonSchema.parse(data)
}

export function validateLessonSafe(data: unknown) {
  return lessonSchema.safeParse(data)
}
