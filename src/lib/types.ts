/**
 * TypeScript-типы структуры урока LogosAI.
 * Строго описывают JSON, который возвращает LLM через Edge Function
 * и который хранится в поле lessons.raw_json.
 */

export type DifficultyLevel = 'low' | 'medium' | 'high'

export type ExerciseType = 'choice' | 'match' | 'sequence' | 'exclude'

export interface ExerciseAsset {
  /** URL картинки (PECS-карточка или иллюстрация) */
  imageUrl: string
  /** Текст, который озвучивается Web Speech API при показе/клике */
  audioText: string
  /** Подпись под карточкой (опционально) */
  label?: string
}

export interface BaseExercise {
  id: string
  type: ExerciseType
  /** Инструкция ребёнку, озвучивается в начале шага */
  instruction: string
}

/**
 * choice — сетка кликабельных карточек с картинками.
 * correctAnswerIndex — индекс правильной карточки в массиве options.
 */
export interface ChoiceExercise extends BaseExercise {
  type: 'choice'
  options: ExerciseAsset[]
  correctAnswerIndex: number
}

/**
 * match — две колонки карточек. Нужно соединить пары.
 * left / right — массивы карточек; pairs задаёт корректные сочетания
 * (индекс левого карточки -> индекс правой).
 */
export interface MatchExercise extends BaseExercise {
  type: 'match'
  left: ExerciseAsset[]
  right: ExerciseAsset[]
  pairs: { leftIndex: number; rightIndex: number }[]
}

/**
 * sequence — 3 перемешанные карточки, которые нужно расставить по порядку.
 * correctOrder — массив id карточек в правильной последовательности.
 */
export interface SequenceExercise extends BaseExercise {
  type: 'sequence'
  items: ExerciseAsset[]
  correctOrder: string[]
}

/**
 * exclude — 4 карточки, одна лишняя.
 * oddOneOutIndex — индекс лишней карточки; reason — текстовое объяснение.
 */
export interface ExcludeExercise extends BaseExercise {
  type: 'exclude'
  options: ExerciseAsset[]
  oddOneOutIndex: number
  reason: string
}

export type Exercise = ChoiceExercise | MatchExercise | SequenceExercise | ExcludeExercise

export interface PecsScheduleItem {
  id: string
  label: string
  imageUrl: string
  audioText: string
  done: boolean
}

export interface LessonContent {
  /** Заголовок урока */
  title: string
  /** Лексическая тема */
  lexicalTheme: string
  /** Уровень сложности */
  difficultyLevel: DifficultyLevel
  /** Визуальное расписание на базе PECS-карт (Экран 1) */
  pecsSchedule: PecsScheduleItem[]
  /** Массив упражнений (Экран 2+) */
  exercises: Exercise[]
}

export interface Lesson {
  id: string
  createdAt: string
  userId: string
  title: string
  lexicalTheme: string
  difficultyLevel: DifficultyLevel
  rawJson: LessonContent
}

export interface StudentProgress {
  id: string
  lessonId: string
  userId: string
  completedAt: string | null
  score: number | null
  livesWasted: number | null
}

export interface Profile {
  id: string
  updatedAt: string
  fullName: string | null
  role: 'speech_therapist' | 'parent' | null
}
