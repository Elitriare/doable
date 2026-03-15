export type BlockerType =
  | "too-big"
  | "too-boring"
  | "no-idea"
  | "fear"
  | "low-energy";

export interface BlockerOption {
  id: BlockerType;
  label: string;
  emoji: string;
  description: string;
}

// Updated step shape from AI breakdown
export interface Step {
  step: string;
  journalPrompt: string;
  estimatedMinutes: number;
}

// Journal entry saved after each step
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
}

export interface Task {
  id: string;
  title: string;
  blocker: BlockerType;
  steps: Step[];
  currentStep: number;
  completed: boolean;
  createdAt: number;
  journal: JournalEntryData[];
}

export interface ScheduledReminder {
  id: string;
  taskTitle: string;
  triggerAt: number;
}

export interface UserProfile {
  rewards: string[];
}

export type AppScreen =
  | "home"
  | "blocker"
  | "coaching"
  | "complete"
  | "journey";