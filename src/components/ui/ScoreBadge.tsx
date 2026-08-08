import { scoreColor, scoreLabel } from '../../lib/scoring'
import { cn } from '../../lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

export function ScoreBadge({ score, size = 'md', showLabel = false, className }: ScoreBadgeProps) {
  const color = scoreColor(score)

  const textSize = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl', xl: 'text-5xl' }
  const labelSize = { sm: 'text-[9px]', md: 'text-[10px]', lg: 'text-xs', xl: 'text-sm' }

  return (
    <div className={cn('flex flex-col items-center gap-0.5', className)}>
      <span
        className={cn('font-serif tabular-nums leading-none', textSize[size])}
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
      {showLabel && (
        <span className={cn('font-medium uppercase tracking-wider', labelSize[size])} style={{ color }}>
          {scoreLabel(score)}
        </span>
      )}
    </div>
  )
}
