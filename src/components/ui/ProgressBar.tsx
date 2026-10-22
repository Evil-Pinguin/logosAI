interface ProgressBarProps {
  value: number   // 0..100
  max?: number
}

export const ProgressBar = ({ value, max = 100 }: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
