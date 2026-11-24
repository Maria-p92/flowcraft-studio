import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Clock,
  Crown,
  Flame,
  Gauge,
  Sprout,
  Volume2,
  VolumeX,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { Multiplier, Rank } from '../types/flow';

interface HeaderProps {
  hoursSaved: number;
  multiplier: Multiplier;
  rank: Rank;
  completed: number;
  total: number;
  muted: boolean;
  onToggleMute: () => void;
}

const STREAK_STYLE: Record<Multiplier, string> = {
  1: 'border-slate-200 bg-slate-100 text-slate-600',
  2: 'border-amber-200 bg-amber-50 text-amber-700',
  3: 'border-rose-200 bg-gradient-to-br from-orange-100 to-rose-100 text-rose-700',
};

const RANK_STYLE: Record<Rank, { icon: LucideIcon; classes: string }> = {
  'No-Code Apprentice': { icon: Sprout, classes: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  'Ops Specialist': { icon: Gauge, classes: 'border-sky-200 bg-sky-50 text-sky-700' },
  'Flow Architect': { icon: Crown, classes: 'border-violet-200 bg-violet-50 text-violet-700' },
};

const SPRING = { type: 'spring', stiffness: 500, damping: 16 } as const;

function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useMotionValueEvent(motionValue, 'change', (latest) => setDisplay(Math.round(latest)));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, motionValue]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1.14, color: '#4F46E5' }}
      animate={{ scale: 1, color: '#0F172A' }}
      transition={{ duration: 0.5 }}
      className="inline-block text-xl font-semibold tabular-nums"
    >
      {display}
    </motion.span>
  );
}

export default function Header({
  hoursSaved,
  multiplier,
  rank,
  completed,
  total,
  muted,
  onToggleMute,
}: HeaderProps) {
  const { icon: RankIcon, classes: rankClasses } = RANK_STYLE[rank];

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#F8F9FA]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_2px_0_0_rgb(67,56,202),0_6px_14px_-4px_rgba(79,70,229,0.5)]">
            <Workflow className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">FlowCraft</p>
            <p className="text-xs text-slate-500">Automation Studio</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Hours saved */}
          <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
            <Clock className="h-4 w-4 text-indigo-500" />
            <div className="leading-none">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Hours Saved / Mo
              </p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={hoursSaved} />
                <span className="text-xs font-medium text-slate-400">h</span>
              </div>
            </div>
          </div>

          {/* Streak multiplier */}
          <motion.div
            key={multiplier}
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING}
            title="Streak multiplier: clean missions in a row boost the hours you bank"
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${STREAK_STYLE[multiplier]}`}
          >
            <Flame className="h-4 w-4" />
            <div className="leading-none">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">Streak</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tabular-nums">{multiplier}x</span>
                <div className="flex gap-0.5" aria-hidden>
                  {[1, 2, 3].map((pip) => (
                    <span
                      key={pip}
                      className={`h-1.5 w-3 rounded-full ${pip <= multiplier ? 'bg-current' : 'bg-black/10'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rank */}
          <div className={`rounded-2xl border px-3.5 py-2 ${rankClasses}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={rank}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <RankIcon className="h-4 w-4" />
                <div className="leading-none">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider opacity-70">
                    Rank · {completed}/{total}
                  </p>
                  <p className="text-sm font-semibold">{rank}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10">
              <motion.div
                className="h-full rounded-full bg-current"
                initial={false}
                animate={{ width: `${(completed / total) * 100}%` }}
                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              />
            </div>
          </div>

          {/* Sound toggle */}
          <motion.button
            type="button"
            onClick={onToggleMute}
            whileTap={{ scale: 0.9 }}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={!muted}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/5 bg-white text-slate-500 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:text-slate-900"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>
    </header>
  );
}