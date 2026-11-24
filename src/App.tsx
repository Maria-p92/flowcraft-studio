import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Lightbulb,
  Lock,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import Header from './components/Header';
import FlowCanvas, { NodeChip } from './components/FlowCanvas';
import {
  MISSIONS,
  SLOT_KIND,
  SLOT_LABEL,
  SLOT_ORDER,
  emptySlots,
  getMultiplier,
  getRank,
  validateFlow,
} from './data/missions';
import { playClick, playConnect, playError, playSuccess, setMuted } from './utils/sound';
import type {
  Feedback,
  FlowNode,
  MissionReward,
  NodeKind,
  PlayerState,
  RunStatus,
  SlotId,
  SlotState,
} from './types/flow';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const INITIAL_PLAYER: PlayerState = { hoursSaved: 0, streak: 0, completedMissionIds: [] };

const STEP_MS = 650;

const DOT_GRID: CSSProperties = {
  backgroundColor: '#F8F9FA',
  backgroundImage: 'radial-gradient(rgba(120, 104, 80, 0.2) 1.25px, transparent 1.25px)',
  backgroundSize: '22px 22px',
};

const SURFACE =
  'rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-16px_rgba(16,24,40,0.15)]';

const BURST_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#0EA5E9', '#8B5CF6'] as const;

const DOCK_SECTIONS: readonly { kind: NodeKind; title: string; subtitle: string }[] = [
  { kind: 'trigger', title: 'Triggers', subtitle: 'When this happens…' },
  { kind: 'action', title: 'Actions', subtitle: '…then do this' },
];

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((dot) => (
        <span
          key={dot}
          className={`h-1.5 w-1.5 rounded-full ${dot <= level ? 'bg-indigo-500' : 'bg-slate-200'}`}
        />
      ))}
    </span>
  );
}

function Burst() {
  const count = 14;
  return (
    <div className="pointer-events-none absolute left-1/2 top-14 h-0 w-0" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const distance = 70 + (i % 3) * 22;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{ backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.2, 0.6],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [missionIndex, setMissionIndex] = useState(0);
  const [slots, setSlots] = useState<SlotState>(emptySlots);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [activeSlot, setActiveSlot] = useState<SlotId | null>(null);
  const [wrongSlots, setWrongSlots] = useState<SlotId[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [reward, setReward] = useState<MissionReward | null>(null);
  const [muted, setMutedState] = useState(false);

  const timers = useRef<number[]>([]);

  const mission = MISSIONS[missionIndex];
  const isLastMission = missionIndex === MISSIONS.length - 1;

  const nodesById = useMemo(
    () =>
      mission.nodes.reduce<Record<string, FlowNode>>((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {}),
    [mission],
  );

  const placedIds = new Set(Object.values(slots).filter((id): id is string => id !== null));
  const dockNodes = mission.nodes.filter((node) => !placedIds.has(node.id));
  const locked = status === 'running' || status === 'success';

  /* ---- timers ---- */

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /* ---- board helpers ---- */

  const resetBoard = useCallback(() => {
    clearTimers();
    setSlots(emptySlots());
    setStatus('idle');
    setActiveSlot(null);
    setWrongSlots([]);
    setFeedback(null);
    setShowHint(false);
  }, [clearTimers]);

  const clearErrors = () => {
    setStatus('idle');
    setWrongSlots([]);
    setFeedback(null);
  };

  /* ---- interactions ---- */

  const handlePick = (node: FlowNode) => {
    if (locked) return;

    const target = SLOT_ORDER.find((slot) => SLOT_KIND[slot] === node.kind && slots[slot] === null);
    if (target === undefined) {
      playError();
      setFeedback({
        tone: 'warning',
        text:
          node.kind === 'trigger'
            ? 'The trigger slot is already taken. Remove it first to swap.'
            : 'Both action slots are full. Remove one to swap.',
      });
      return;
    }

    const next: SlotState = { ...slots };
    next[target] = node.id;
    setSlots(next);
    clearErrors();

    const index = SLOT_ORDER.indexOf(target);
    const before = SLOT_ORDER[index - 1];
    const after = SLOT_ORDER[index + 1];
    const snapsToNeighbour =
      (before !== undefined && next[before] !== null) || (after !== undefined && next[after] !== null);

    if (snapsToNeighbour) playConnect();
    else playClick();
  };

  const handleRemove = (slot: SlotId) => {
    if (locked || slots[slot] === null) return;
    const next: SlotState = { ...slots };
    next[slot] = null;
    setSlots(next);
    clearErrors();
    playClick(0.7);
  };

  const handleRun = () => {
    if (locked) return;

    const result = validateFlow(mission, slots);

    if (result.status === 'incomplete') {
      playError();
      setStatus('error');
      setWrongSlots(result.missing);
      setFeedback({
        tone: 'warning',
        text: `Your workflow has empty steps. Fill in: ${result.missing
          .map((slot) => SLOT_LABEL[slot])
          .join(', ')}.`,
      });
      return;
    }

    setStatus('running');
    setWrongSlots([]);
    setFeedback(null);

    const stepsToRun: SlotId[] =
      result.status === 'correct'
        ? [...SLOT_ORDER]
        : SLOT_ORDER.slice(0, SLOT_ORDER.indexOf(result.firstWrong) + 1);

    stepsToRun.forEach((slot, i) => {
      later(() => {
        setActiveSlot(slot);
        playClick(1 + i * 0.25);
      }, i * STEP_MS);
    });

    later(() => {
      setActiveSlot(null);

      if (result.status === 'incorrect') {
        const stepNumber = SLOT_ORDER.indexOf(result.firstWrong) + 1;
        playError();
        setStatus('error');
        setWrongSlots([result.firstWrong]);
        setPlayer((prev) => ({ ...prev, streak: 0 }));
        setFeedback({
          tone: 'error',
          text: `Step ${stepNumber} (${SLOT_LABEL[result.firstWrong]}) doesn’t fit this mission, so your streak was reset. Check the hint and try again.`,
        });
        return;
      }

      const multiplier = getMultiplier(player.streak);
      const baseHours = mission.hoursSavedPerMonth;
      const earnedHours = baseHours * multiplier;
      const completed = [...player.completedMissionIds, mission.id];
      const prevRank = getRank(player.completedMissionIds.length);
      const nextRank = getRank(completed.length);

      playSuccess();
      setStatus('success');
      setPlayer({
        hoursSaved: player.hoursSaved + earnedHours,
        streak: player.streak + 1,
        completedMissionIds: completed,
      });

      const summary: MissionReward = {
        missionId: mission.id,
        baseHours,
        multiplier,
        earnedHours,
        rank: nextRank,
        rankedUp: nextRank !== prevRank,
      };
      later(() => setReward(summary), 1000);
    }, stepsToRun.length * STEP_MS + 100);
  };

  const handleContinue = () => {
    setReward(null);
    if (isLastMission) {
      setPlayer(INITIAL_PLAYER);
      setMissionIndex(0);
    } else {
      setMissionIndex((i) => i + 1);
    }
    resetBoard();
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  /* ---- render ---- */

  return (
    <div className="min-h-screen font-sans text-slate-800" style={DOT_GRID}>
      <Header
        hoursSaved={player.hoursSaved}
        multiplier={getMultiplier(player.streak)}
        rank={getRank(player.completedMissionIds.length)}
        completed={player.completedMissionIds.length}
        total={MISSIONS.length}
        muted={muted}
        onToggleMute={handleToggleMute}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* Mission stepper */}
        <nav className="flex flex-wrap gap-2" aria-label="Missions">
          {MISSIONS.map((m, i) => {
            const isDone = player.completedMissionIds.includes(m.id);
            const isCurrent = i === missionIndex;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : isCurrent
                      ? 'border-indigo-200 bg-white text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white/60 text-slate-400'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : isCurrent ? <Zap className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                Mission {i + 1}
              </div>
            );
          })}
        </nav>

        {/* Mission card */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={mission.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={`${SURFACE} p-5 sm:p-6`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-indigo-600">
                    Mission {missionIndex + 1} of {MISSIONS.length}
                  </span>
                  <DifficultyDots level={mission.difficulty} />
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Saves ~{mission.hoursSavedPerMonth} h / mo
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{mission.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{mission.brief}</p>
              </div>

              <motion.button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                whileTap={{ scale: 0.95 }}
                aria-expanded={showHint}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </motion.button>
            </div>

            <AnimatePresence initial={false}>
              {showHint && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <span className="mt-4 block rounded-xl bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                    {mission.hint}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>
        </AnimatePresence>

        {/* Canvas */}
        <FlowCanvas
          key={mission.id}
          slots={slots}
          nodesById={nodesById}
          status={status}
          activeSlot={activeSlot}
          wrongSlots={wrongSlots}
          onRemove={handleRemove}
          onRun={handleRun}
        />

        {/* Feedback */}
        <AnimatePresence>
          {feedback !== null && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                feedback.tone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {feedback.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node dock */}
        <section className={`${SURFACE} bg-gradient-to-b from-white to-slate-50/80 p-5 sm:p-6`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Node dock</h2>
            <p className="text-xs text-slate-400">
              Tap a node to drop it into the next open slot. Tap ✕ on a slot to take it back.
            </p>
          </div>

          <div className="space-y-5">
            {DOCK_SECTIONS.map(({ kind, title, subtitle }) => {
              const nodes = dockNodes.filter((node) => node.kind === kind);
              return (
                <div key={kind}>
                  <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {title} <span className="font-medium normal-case tracking-normal">· {subtitle}</span>
                  </p>
                  <div className="flex min-h-[4.5rem] flex-wrap gap-3">
                    {nodes.length === 0 ? (
                      <p className="flex items-center text-sm text-slate-300">Nothing left here.</p>
                    ) : (
                      nodes.map((node) => (
                        <NodeChip key={node.id} node={node} locked={locked} onClick={() => handlePick(node)} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Executive summary modal */}
      <AnimatePresence>
        {reward !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="summary-title"
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="relative w-full max-w-md rounded-3xl border border-black/5 bg-white p-7 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
            >
              <Burst />

              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.1 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-[0_3px_0_0_rgb(167,243,208)]"
                >
                  <Sparkles className="h-7 w-7" />
                </motion.div>

                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                  Executive summary
                </p>
                <h2 id="summary-title" className="mt-1 text-xl font-semibold text-slate-900">
                  {mission.title} is live
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{mission.summary.narrative}</p>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-3xl font-semibold tabular-nums text-slate-900">
                  +{reward.earnedHours} <span className="text-base font-medium text-slate-400">h / mo</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {reward.baseHours} h saved × {reward.multiplier}x streak bonus
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                  <dt className="mb-1 font-semibold uppercase tracking-wider text-rose-500">Before</dt>
                  <dd className="text-slate-700">{mission.summary.manualEffort}</dd>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <dt className="mb-1 font-semibold uppercase tracking-wider text-emerald-600">After</dt>
                  <dd className="text-slate-700">{mission.summary.automatedEffort}</dd>
                </div>
              </dl>

              <p className="mt-4 text-center text-xs text-slate-500">
                That’s about {reward.baseHours * 12} hours a year, or roughly{' '}
                {Math.round((reward.baseHours * 12) / 8)} working days back.
              </p>

              {reward.rankedUp && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700"
                >
                  <Trophy className="h-4 w-4" />
                  Rank up! You’re now a {reward.rank}.
                </motion.div>
              )}

              <motion.button
                type="button"
                autoFocus
                onClick={handleContinue}
                whileHover={{ y: -2 }}
                whileTap={{ y: 2, scale: 0.98 }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_3px_0_0_rgb(55,48,163),0_10px_20px_-8px_rgba(79,70,229,0.6)] hover:bg-indigo-500"
              >
                {isLastMission ? 'Restart campaign' : 'Next mission'}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}