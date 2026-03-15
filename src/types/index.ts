export type BlockerType =
  | "too-big"
  | "too-boring"
  | "no-idea"
  | "fear"
  | "low-energy";

export interface BlockerOption {
  id: BlockerType;
  label: string;
  image: string;
  description: string;
}

export interface Step {
  step: string;
  journalPrompt: string;
  estimatedMinutes: number;
}

export interface JournalEntryData {
  stepIndex: number;
  stepText: string;
  photo: string;
  caption: string;
  reflection: string;
  completedAt: number;
}

export interface MicroStep {
  id: number;
  text: string;
  completed: boolean;
  startedAt?: number;
  completedAt?: number;
  proofUploaded?: boolean;
}

export interface Task {
  id: string;
  title: string;
  blocker: BlockerType;
  category: string;
  steps: Step[];
  currentStep: number;
  completed: boolean;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  journal: JournalEntryData[];
  calendarEventIds?: string[]; // one per step, in order
}

export interface ScheduledReminder {
  id: string;
  taskTitle: string;
  triggerAt: number;
}

export interface PointEvent {
  delta: number;
  reason: "step_complete" | "task_complete" | "streak_bonus" | "first_today" | "forfeit";
  taskTitle: string;
  timestamp: number;
}

export interface UserProfile {
  rewards: string[];
  points: number;
  friendCode: string;
  displayName: string;
  avatarUrl?: string;
  friends: string[]; // array of friend userEmails
  pointsHistory: PointEvent[];
}

export type AppScreen =
  | "home"
  | "blocker"
  | "coaching"
  | "complete"
  | "journey";

export type AppTab = "coach" | "calendar" | "compete" | "analytics";
