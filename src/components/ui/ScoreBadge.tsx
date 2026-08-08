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

  const sizes = {
    sm: { outer: 'w-9 h-9 text-sm', ring: 36, sw: 3 },
    md: { outer: 'w-12 h-12 text-base', ring: 48, sw: 3.5 },
    lg: { outer: 'w-16 h-16 text-xl', ring: 64, sw: 4 },
    xl: { outer: 'w-24 h-24 text-3xl', ring: 96, sw: 5 },
  }

  const { outer, ring, sw } = sizes[size]
  const r = (ring - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = score / 10
  const dash = circ * pct
  const offset = circ * 0.25

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative flex items-center justify-center', outer)}>
        <svg className="absolute inset-0 -rotate-90" width={ring} height={ring}>
          <circle cx={ring/2} cy={ring/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={sw} />
          <circle
            cx={ring/2} cy={ring/2} r={r} fill="none"
            stroke={color} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset + circ * 0.75}
            strokeLinecap="round"
          />
        </svg>
        <span className="font-semibold tabular-nums leading-none" style={{ color, fontSize: size === 'xl' ? 28 : undefined }}>
          {score.toFixed(1)}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>{scoreLabel(score)}</span>
      )}
    </div>
  )
}
