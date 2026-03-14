"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface TaskInputProps {
  onSubmit: (task: string) => void;
}

export default function TaskInput({ onSubmit }: TaskInputProps) {
  const [task, setTask] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      onSubmit(task.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          doable
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Turn overwhelming tasks into doable steps
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What do you need to get done?"
          className="w-full p-4 rounded-2xl bg-gray-900 border border-gray-800 text-white
                     placeholder-gray-500 text-lg focus:outline-none focus:border-violet-500
                     transition-colors"
          autoFocus
        />
        <motion.button
          type="submit"
          disabled={!task.trim()}
          className="w-full mt-4 py-4 rounded-2xl font-bold text-lg cursor-pointer
                     bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white
                     hover:from-violet-600 hover:to-fuchsia-600 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={task.trim() ? { scale: 1.02 } : {}}
          whileTap={task.trim() ? { scale: 0.98 } : {}}
        >
          Let&apos;s Make It Doable
        </motion.button>
      </motion.form>
    </div>
  );
}
