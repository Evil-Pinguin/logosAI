import { create } from 'zustand'
import type { LessonContent, Exercise } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Типы состояния                                                     */
/* ------------------------------------------------------------------ */

const INITIAL_LIVES = 3

export interface GameState {
  // Текущий урок (от API / Edge Function)
  currentLesson: LessonContent | null

  // Индекс шага: -1 = экран PECS, 0..N-1 = упражнения
  currentStep: number

  // Игровая механика
  lives: number
  score: number
  isGameOver: boolean
  isCompleted: boolean

  // Действия
  startLesson: (lesson: LessonContent) => void
  nextStep: () => void
  loseLife: () => void
  addScore: (points: number) => void
  resetGame: () => void

  // Хелперы
  getCurrentExercise: () => Exercise | null
  progressPercent: () => number
}

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

export const useGameStore = create<GameState>((set, get) => ({
  currentLesson: null,
  currentStep: -1,
  lives: INITIAL_LIVES,
  score: 0,
  isGameOver: false,
  isCompleted: false,

  startLesson: (lesson: LessonContent) => {
    set({
      currentLesson: lesson,
      currentStep: -1,
      lives: INITIAL_LIVES,
      score: 0,
      isGameOver: false,
      isCompleted: false,
    })
  },

  nextStep: () => {
    const { currentLesson, currentStep, lives } = get()
    if (!currentLesson) return

    if (lives <= 0) {
      set({ isGameOver: true })
      return
    }

    const nextIndex = currentStep + 1
    const totalExercises = currentLesson.exercises.length

    if (nextIndex >= totalExercises) {
      // Все упражнения пройдены — финиш
      set({ isCompleted: true, currentStep: nextIndex })
    } else {
      set({ currentStep: nextIndex })
    }
  },

  loseLife: () => {
    const { lives } = get()
    const newLives = Math.max(0, lives - 1)
    set({
      lives: newLives,
      isGameOver: newLives <= 0,
    })
  },

  addScore: (points: number) => {
    set((state) => ({
      score: Math.max(0, state.score + points),
    }))
  },

  resetGame: () => {
    set({
      currentLesson: null,
      currentStep: -1,
      lives: INITIAL_LIVES,
      score: 0,
      isGameOver: false,
      isCompleted: false,
    })
  },

  getCurrentExercise: (): Exercise | null => {
    const { currentLesson, currentStep } = get()
    if (!currentLesson || currentStep < 0) return null
    return currentLesson.exercises[currentStep] ?? null
  },

  progressPercent: (): number => {
    const { currentLesson, currentStep, isCompleted } = get()
    if (!currentLesson) return 0
    const totalSteps = 1 + currentLesson.exercises.length // 1 (PECS) + упражнения
    if (isCompleted) return 100
    const completed = Math.max(0, currentStep + 1) // при currentStep = -1 → 0, при 0 → 1
    return Math.round((completed / totalSteps) * 100)
  },
}))
