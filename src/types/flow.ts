export type NodeKind = 'trigger' | 'action';

/** The three fixed slots of a workflow: 1 trigger followed by 2 ordered actions. */
export type SlotId = 'trigger' | 'action1' | 'action2';

export type NodeTone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';

export type NodeIconName =
  | 'form'
  | 'clock'
  | 'sheet'
  | 'chat'
  | 'archive'
  | 'megaphone'
  | 'receipt'
  | 'mail'
  | 'task'
  | 'refund'
  | 'user-plus'
  | 'wallet'
  | 'video'
  | 'alert'
  | 'survey'
  | 'gift'
  | 'trending-down';

export interface FlowNode {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  icon: NodeIconName;
  tone: NodeTone;
}

export type Difficulty = 1 | 2 | 3;

export interface MissionSummary {
  manualEffort: string;
  automatedEffort: string;
  narrative: string;
}

export interface Mission {
  id: string;
  title: string;
  brief: string;
  difficulty: Difficulty;
  /** Realistic base hours saved per month once the workflow is live. */
  hoursSavedPerMonth: number;
  hint: string;
  /** Maps each slot to the id of the node that belongs there. */
  solution: Record<SlotId, string>;
  /** Correct nodes mixed with distractors. */
  nodes: readonly FlowNode[];
  summary: MissionSummary;
}

/** The node id placed in each slot, or null when empty. */
export type SlotState = Record<SlotId, string | null>;

export type Rank = 'No-Code Apprentice' | 'Ops Specialist' | 'Flow Architect';

export type Multiplier = 1 | 2 | 3;

export interface PlayerState {
  hoursSaved: number;
  /** Missions completed in a row without a failed run. */
  streak: number;
  completedMissionIds: string[];
}

export type RunStatus = 'idle' | 'running' | 'error' | 'success';

export type SlotVisual = 'idle' | 'active' | 'wrong' | 'success';

export type FlowValidation =
  | { status: 'incomplete'; missing: SlotId[] }
  | { status: 'correct' }
  | { status: 'incorrect'; wrongSlots: SlotId[]; firstWrong: SlotId };

export interface Feedback {
  tone: 'error' | 'warning';
  text: string;
}

export interface MissionReward {
  missionId: string;
  baseHours: number;
  multiplier: Multiplier;
  earnedHours: number;
  rank: Rank;
  rankedUp: boolean;
}