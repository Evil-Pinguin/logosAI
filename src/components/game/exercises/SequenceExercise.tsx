import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Exercise } from '@/lib/types'

interface SequenceExerciseProps {
  exercise: Extract<Exercise, { type: 'sequence' }>
}

export function SequenceExercise({ exercise }: SequenceExerciseProps) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Расставьте по порядку</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          {exercise.instruction}
        </p>
      </CardHeader>
      <CardContent className="pt-0 pb-8">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-slate-400">
            Упражнение типа «Последовательность» находится в разработке.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
