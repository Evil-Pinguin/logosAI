import { z } from 'zod'

/**
 * Zod-схема для валидации JSON-ответа LLM перед отправкой на фронтенд.
 * Используется в Supabase Edge Function (generate-lesson).
 */

export const exerciseAssetSchema = z.object({
  imageUrl: z.string().url(),
  audioText: z.string().min(1),
  label: z.string().optional(),
})

export const choiceExerciseSchema = z.object({
  id: z.string(),
  type: z.literal('choice'),
  instruction: z.string().min(1),
  options: z.array(exerciseAssetSchema).min(2).max(6),
  correctAnswerIndex: z.number().int().nonnegative(),
})

export const matchExerciseSchema = z.object({
  id: z.string(),
  type: z.literal('match'),
  instruction: z.string().min(1),
  left: z.array(exerciseAssetSchema).min(2).max(5),
  right: z.array(exerciseAssetSchema).min(2).max(5),
  pairs: z.array(
    z.object({
      leftIndex: z.number().int().nonnegative(),
      rightIndex: z.number().int().nonnegative(),
    }),
  ),
})

export const sequenceExerciseSchema = z.object({
  id: z.string(),
  type: z.literal('sequence'),
  instruction: z.string().min(1),
  items: z.array(exerciseAssetSchema).length(3),
  correctOrder: z.array(z.string()).length(3),
})

export const excludeExerciseSchema = z.object({
  id: z.string(),
  type: z.literal('exclude'),
  instruction: z.string().min(1),
  options: z.array(exerciseAssetSchema).length(4),
  oddOneOutIndex: z.number().int().min(0).max(3),
  reason: z.string().min(1),
})

export const exerciseSchema = z.discriminatedUnion('type', [
  choiceExerciseSchema,
  matchExerciseSchema,
  sequenceExerciseSchema,
  excludeExerciseSchema,
])

export const pecsScheduleItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  imageUrl: z.string().url(),
  audioText: z.string().min(1),
  done: z.boolean().default(false),
})

export const lessonContentSchema = z.object({
  title: z.string().min(1),
  lexicalTheme: z.string().min(1),
  difficultyLevel: z.enum(['low', 'medium', 'high']),
  pecsSchedule: z.array(pecsScheduleItemSchema).min(1).max(8),
  exercises: z.array(exerciseSchema).min(1).max(10),
})

export type LessonContentInput = z.infer<typeof lessonContentSchema>
export type ExerciseInput = z.infer<typeof exerciseSchema>

export function validateLessonContent(data: unknown) {
  return lessonContentSchema.safeParse(data)
}
