"use client";

import { useState, useRef, useCallback } from "react";

interface Props {
  step: string;
  journalPrompt: string;
  stepNumber: number;
  totalSteps: number;
  onComplete: (entry: { photo: string; caption: string; reflection: string }) => void;
}

export default function JournalEntry({ step, journalPrompt, stepNumber, totalSteps, onComplete }: Props) {
  const [phase, setPhase] = useState<"prompt" | "capture" | "reflecting" | "done">("prompt");
  const [photo, setPhoto] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = e.target?.result as string;
      setPhoto(photoData);
      setPhase("reflecting");

      try {
        const res = await fetch("/api/reflect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step, caption: "" }),
        });
        const { reflection: r } = await res.json();
        setReflection(r);
      } catch {
        setReflection("Solid work on this step. Keep the momentum going.");
      }

      setPhase("done");
    };
    reader.readAsDataURL(f);
  }, [step]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (phase === "prompt") return (
    <div className="text-center">
      <p className="text-gray-400 text-sm leading-relaxed mb-6">{journalPrompt}</p>
      <button
        onClick={() => setPhase("capture")}
        className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
      >
        Done — document it 📸
      </button>
    </div>
  );

  if (phase === "capture") return (
    <div>
      <p className="text-gray-400 text-sm mb-3 text-center">Take or upload a photo of what you just did</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? "border-violet-400 bg-violet-500/10" : "border-gray-700 hover:border-gray-500"}`}
      >
        <p className="text-white font-medium mb-1">Drop image or click to browse</p>
        <p className="text-gray-500 text-sm">JPG or PNG</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );

  if (phase === "reflecting") return (
    <div className="text-center py-6">
      <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-300 font-medium">Writing your reflection...</p>
    </div>
  );

  return (
    <div className="text-center">
      <div className="text-4xl mb-3">✨</div>
      <div className="bg-gray-800 rounded-2xl p-4 mb-6 text-left">
        <img src={photo!} alt="Step proof" className="w-full max-h-40 object-contain rounded-xl mb-3" />
        <p className="text-violet-300 text-sm leading-relaxed">{reflection}</p>
      </div>
      <button
        onClick={() => onComplete({ photo: photo!, caption: "", reflection })}
        className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
      >
        {stepNumber === totalSteps ? "Finish & see your journey! 🎉" : "On to the next step →"}
      </button>
    </div>
  );
}