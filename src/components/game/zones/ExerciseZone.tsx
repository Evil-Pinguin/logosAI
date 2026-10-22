import { useGameStore } from '@/store/gameStore'
import { ChoiceExercise } from '@/components/game/exercises/ChoiceExercise'
import { ExcludeExercise } from '@/components/game/exercises/ExcludeExercise'
import { MatchExercise } from '@/components/game/exercises/MatchExercise'
import { SequenceExercise } from '@/components/game/exercises/SequenceExercise'


/**
 * ExerciseZone — рендерит соответствующий компонент упражнения
 * в зависимости от типа из текущего состояния Zustand-стора.
 */
export function ExerciseZone() {
  const { getCurrentExercise } = useGameStore()
  const exercise = getCurrentExercise()

  if (!exercise) return null

  switch (exercise.type) {
    case 'choice':
      return <ChoiceExercise exercise={exercise} />
    case 'match':
      return <MatchExercise exercise={exercise} />
    case 'sequence':
      return <SequenceExercise exercise={exercise} />
    case 'exclude':
      return <ExcludeExercise exercise={exercise} />
  }
}
