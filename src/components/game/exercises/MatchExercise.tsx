import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Exercise } from '@/lib/types'

interface MatchExerciseProps {
  exercise: Extract<Exercise, { type: 'match' }>
}

export function MatchExercise({ exercise }: MatchExerciseProps) {

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Соедините пары</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          {exercise.instruction}
        </p>
      </CardHeader>
      <CardContent className="pt-0 pb-8">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-slate-400">
            Упражнение типа «Соответствие» находится в разработке.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
