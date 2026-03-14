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

export interface MicroStep {
  id: number;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  blocker: BlockerType;
  steps: MicroStep[];
  currentStep: number;
  completed: boolean;
  createdAt: number;
}

export interface UserProfile {
  rewards: string[];
}

export type AppScreen =
  | "home"
  | "blocker"
  | "coaching"
  | "complete";
