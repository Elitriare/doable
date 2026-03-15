import { BlockerOption } from "@/types";

export const BLOCKER_OPTIONS: BlockerOption[] = [
  {
    id: "too-big",
    label: "It feels too big",
    image: "/images/toobig.png",
    description: "The task feels overwhelming and I don't know how to tackle it all",
  },
  {
    id: "too-boring",
    label: "It's too boring",
    image: "/images/boring.png",
    description: "I just can't motivate myself to do something this tedious",
  },
  {
    id: "no-idea",
    label: "I don't know where to start",
    image: "/images/noidea.png",
    description: "I'm not sure what the first step even is",
  },
  {
    id: "fear",
    label: "I'm scared of doing it wrong",
    image: "/images/scared.png",
    description: "I'm worried about making mistakes or failing",
  },
  {
    id: "low-energy",
    label: "I have no energy",
    image: "/images/dead.png",
    description: "I'm tired and can't seem to get going",
  },
];

export const DEFAULT_REWARDS: string[] = [
  "Watch an episode of your favorite show",
  "Grab your favorite snack",
  "Take a 15-minute walk outside",
  "Scroll social media guilt-free for 10 minutes",
  "Listen to your favorite song on repeat",
  "Take a power nap",
  "Text a friend something nice",
  "Make yourself a fancy drink",
];
