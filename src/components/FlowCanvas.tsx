import { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  Check,
  ClipboardList,
  CreditCard,
  FileInput,
  Gift,
  ListChecks,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Play,
  Plus,
  Receipt,
  Table2,
  TrendingDown,
  Undo2,
  UserPlus,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { SLOT_KIND, SLOT_LABEL, SLOT_ORDER } from '../data/missions';
import type {
  FlowNode,
  NodeIconName,
  NodeTone,
  RunStatus,
  SlotId,
  SlotState,
  SlotVisual,
} from '../types/flow';

/* ------------------------------------------------------------------ */
/* Shared visual tokens                                                */
/* ------------------------------------------------------------------ */

const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const;

const ICONS: Record<NodeIconName, LucideIcon> = {
  form: FileInput,
  clock: CalendarClock,
  sheet: Table2,
  chat: MessageSquare,
  archive: Archive,
  megaphone: Megaphone,
  receipt: Receipt,
  mail: Mail,
  task: ListChecks,
  refund: Undo2,
  'user-plus': UserPlus,
  wallet: CreditCard,
  video: Video,
  alert: AlertTriangle,
  survey: ClipboardList,
  gift: Gift,
  'trending-down': TrendingDown,
};

const TONES: Record<NodeTone, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
};

const SLOT_RING: Record<SlotVisual, string> = {
  idle: 'border-slate-200',
  active: 'border-indigo-400 ring-4 ring-indigo-100',
  wrong: 'border-rose-300 ring-4 ring-rose-100',
  success: 'border-emerald-300 ring-4 ring-emerald-100',
};

/* ------------------------------------------------------------------ */
/* NodeChip (used in the dock and inside slots, so layoutId can morph) */
/* ------------------------------------------------------------------ */

interface NodeChipProps {
  node: FlowNode;
  onClick?: () => void;
  locked?: boolean;
}

export function NodeChip({ node, onClick, locked = false }: NodeChipProps) {
  const Icon = ICONS[node.icon];
  const interactive = onClick !== undefined && !locked;

  return (
    <motion.div
      layout
      layoutId={`node-${node.id}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Add ${node.label}` : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      whileHover={interactive ? { y: -3, scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.95, y: 1 } : undefined}
      transition={SPRING}
      className={`flex min-h-[4.5rem] w-[13.5rem] select-none items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(16,24,40,0.06),0_8px_20px_-10px_rgba(16,24,40,0.2)] ${
        interactive ? 'cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-indigo-200' : ''
      } ${locked ? 'opacity-60' : ''}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[node.tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug text-slate-800">{node.label}</span>
        <span className="block truncate text-xs text-slate-500">{node.description}</span>
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Connector: animated dashed SVG line between two slots               */
/* ------------------------------------------------------------------ */

interface ConnectorGraphicProps {
  line: string;
  arrow: string;
  connected: boolean;
  flowing: boolean;
}

function ConnectorGraphic({ line, arrow, connected, flowing }: ConnectorGraphicProps) {
  const color = connected ? '#6366F1' : '#CBD5E1';

  return (
    <>
      <motion.path
        d={line}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="6 6"
        initial={false}
        animate={{ stroke: color, strokeDashoffset: connected ? [0, -12] : 0 }}
        transition={{
          stroke: { duration: 0.3 },
          strokeDashoffset: connected
            ? { repeat: Infinity, ease: 'linear', duration: 0.7 }
            : { duration: 0 },
        }}
      />
      <motion.path
        d={arrow}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ stroke: color }}
        transition={{ duration: 0.3 }}
      />
      {flowing && (
        <circle r="4.5" fill="#6366F1">
          <animateMotion dur="0.6s" fill="freeze" path={line} />
        </circle>
      )}
    </>
  );
}

function Connector({ connected, flowing }: { connected: boolean; flowing: boolean }) {
  return (
    <div className="flex h-12 w-full items-center justify-center lg:mt-6 lg:h-auto lg:w-16" aria-hidden>
      <svg className="hidden lg:block" width="64" height="48" viewBox="0 0 64 48" fill="none">
        <ConnectorGraphic
          line="M4 24 H56"
          arrow="M52 18 L60 24 L52 30"
          connected={connected}
          flowing={flowing}
        />
      </svg>
      <svg className="lg:hidden" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <ConnectorGraphic
          line="M24 4 V38"
          arrow="M18 34 L24 42 L30 34"
          connected={connected}
          flowing={flowing}
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slot                                                                */
/* ------------------------------------------------------------------ */

interface SlotProps {
  slotId: SlotId;
  node: FlowNode | null;
  visual: SlotVisual;
  canRemove: boolean;
  onRemove: () => void;
}

function Slot({ slotId, node, visual, canRemove, onRemove }: SlotProps) {
  const isTrigger = SLOT_KIND[slotId] === 'trigger';

  return (
    <motion.div
      initial={false}
      animate={visual === 'wrong' ? { x: [0, -9, 9, -6, 6, 0], scale: 1 } : { x: 0, scale: visual === 'active' ? 1.04 : 1 }}
      transition={visual === 'wrong' ? { duration: 0.45 } : SPRING}
      className={`flex shrink-0 flex-col items-center gap-2 rounded-3xl border bg-white/60 p-3 transition-[border-color,box-shadow] duration-300 ${SLOT_RING[visual]} ${
        node === null ? 'border-dashed' : ''
      }`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {SLOT_LABEL[slotId]}
      </span>

      <div className="relative">
        {node === null ? (
          <div className="flex h-[4.5rem] w-[13.5rem] items-center justify-center gap-2 rounded-2xl bg-slate-100/70 text-sm text-slate-400">
            <Plus className="h-4 w-4" />
            {isTrigger ? 'Pick a trigger below' : 'Pick an action below'}
          </div>
        ) : (
          <>
            <NodeChip node={node} />
            {canRemove && (
              <motion.button
                type="button"
                onClick={onRemove}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                aria-label={`Remove ${node.label}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-slate-500 shadow-sm hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* FlowCanvas                                                          */
/* ------------------------------------------------------------------ */

interface FlowCanvasProps {
  slots: SlotState;
  nodesById: Record<string, FlowNode>;
  status: RunStatus;
  activeSlot: SlotId | null;
  wrongSlots: readonly SlotId[];
  onRemove: (slot: SlotId) => void;
  onRun: () => void;
}

export default function FlowCanvas({
  slots,
  nodesById,
  status,
  activeSlot,
  wrongSlots,
  onRemove,
  onRun,
}: FlowCanvasProps) {
  const running = status === 'running';
  const done = status === 'success';
  const locked = running || done;

  const visualFor = (slot: SlotId): SlotVisual => {
    if (done) return 'success';
    if (wrongSlots.includes(slot)) return 'wrong';
    if (activeSlot === slot) return 'active';
    return 'idle';
  };

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-16px_rgba(16,24,40,0.15)] sm:p-7">
      <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-center">
        {SLOT_ORDER.map((slot, index) => {
          const nodeId = slots[slot];
          const node = nodeId === null ? null : nodesById[nodeId] ?? null;
          const nextSlot = SLOT_ORDER[index + 1];
          const hasNext = nextSlot !== undefined;

          return (
            <Fragment key={slot}>
              <Slot
                slotId={slot}
                node={node}
                visual={visualFor(slot)}
                canRemove={!locked}
                onRemove={() => onRemove(slot)}
              />
              {hasNext && (
                <Connector
                  connected={node !== null && slots[nextSlot] !== null}
                  flowing={running && activeSlot === nextSlot}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col items-center gap-2">
        <motion.button
          type="button"
          onClick={onRun}
          disabled={locked}
          whileHover={locked ? undefined : { y: -2 }}
          whileTap={locked ? undefined : { y: 2, scale: 0.98 }}
          transition={SPRING}
          className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
            done
              ? 'bg-emerald-500 shadow-[0_3px_0_0_rgb(4,120,87)]'
              : 'bg-indigo-600 shadow-[0_3px_0_0_rgb(55,48,163),0_10px_20px_-8px_rgba(79,70,229,0.6)] hover:bg-indigo-500'
          } ${running ? 'cursor-wait opacity-90' : ''}`}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : done ? (
            <Check className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          {running ? 'Running…' : done ? 'Workflow is live' : 'Run Workflow'}
        </motion.button>
        <p className="text-xs text-slate-400">
          {locked ? 'Hang tight while your steps execute.' : 'Fill all three steps, then run it.'}
        </p>
      </div>
    </section>
  );
}