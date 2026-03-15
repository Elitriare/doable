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
      <p className="text-[#3a6a94] text-sm leading-relaxed mb-6">{journalPrompt}</p>
      <button
        onClick={() => setPhase("capture")}
        className="w-full py-3 rounded-2xl font-bold text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] transition-all"
      >
        Done — document it 📸
      </button>
    </div>
  );

  if (phase === "capture") return (
    <div>
      <p className="text-[#3a6a94] text-sm mb-3 text-center">Take or upload a photo of what you just did</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? "border-[#4a8fe7] bg-[#4a8fe7]/10" : "border-[#b8d4ed] hover:border-[#4a8fe7]"}`}
      >
        <p className="text-[#1f3a5c] font-medium mb-1">Drop image or click to browse</p>
        <p className="text-[#5a7fa8] text-sm">JPG or PNG</p>
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
      <div className="w-10 h-10 border-2 border-[#4a8fe7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[#3a6a94] font-medium">Writing your reflection...</p>
    </div>
  );

  return (
    <div className="text-center">
      <div className="text-4xl mb-3">✨</div>
      <div className="bg-white/70 border border-[#b8d4ed] rounded-2xl p-4 mb-6 text-left">
        <img src={photo!} alt="Step proof" className="w-full max-h-40 object-contain rounded-xl mb-3" />
        <p className="text-[#2e6dc0] text-sm leading-relaxed">{reflection}</p>
      </div>
      <button
        onClick={() => onComplete({ photo: photo!, caption: "", reflection })}
        className="w-full py-3 rounded-2xl font-bold text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] transition-all"
      >
        {stepNumber === totalSteps ? "Finish & see your journey! 🎉" : "On to the next step →"}
      </button>
    </div>
  );
}