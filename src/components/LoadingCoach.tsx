"use client";

import { motion } from "framer-motion";

const messages = [
  "Breaking it down for you...",
  "Making it doable...",
  "Creating your game plan...",
];

export default function LoadingCoach() {
  const message = messages[0];

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 mx-auto mb-6 rounded-full border-4 border-[#b8d4ed] border-t-[#4a8fe7]"
      />
      <motion.p
        className="text-[#3a6a94] text-lg"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}
