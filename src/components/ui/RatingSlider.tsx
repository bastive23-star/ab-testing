import { motion, AnimatePresence } from 'framer-motion'
import { scoreColor } from '../../lib/scoring'

interface RatingSliderProps {
  label: string
  emoji: string
  value: number
  onChange: (v: number) => void
}

export function RatingSlider({ label, emoji, value, onChange }: RatingSliderProps) {
  const color = scoreColor(value)
  const pct = ((value - 1) / 9) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{emoji}</span>
          <span className="text-sm font-medium text-[#1A1714]">{label}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="text-lg font-semibold tabular-nums min-w-[2.5rem] text-right"
            style={{ color }}
          >
            {value}/10
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="relative h-4 flex items-center">
        <div
          className="absolute inset-y-[6px] left-0 right-0 rounded-full"
          style={{ background: 'rgba(0,0,0,0.08)' }}
        />
        <div
          className="absolute inset-y-[6px] left-0 rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="relative w-full opacity-0 h-4 cursor-pointer z-10"
          aria-label={label}
        />
        <div
          className="absolute pointer-events-none rounded-full bg-white border shadow-md transition-all duration-150"
          style={{
            left: `calc(${pct}% - 10px)`,
            width: 20,
            height: 20,
            borderColor: 'rgba(0,0,0,0.15)',
            boxShadow: `0 2px 8px ${color}44, 0 1px 3px rgba(0,0,0,0.15)`,
          }}
        />
      </div>
    </div>
  )
}
