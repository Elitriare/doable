"use client";

import { useState, useRef, useCallback } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

interface Props {
  step: string;
  onComplete: (file: File) => void;
}

export default function ProofUpload({ step, onComplete }: Props) {
  const [phase, setPhase] = useState<"upload" | "preview" | "verifying" | "rejected">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Only JPG and PNG files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFile(f);
      setPreview(e.target?.result as string);
      setPhase("preview");
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleConfirm = async () => {
    if (!file) return;
    setPhase("verifying");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("step", step);

      const res = await fetch("/api/verify-proof", {
        method: "POST",
        body: formData,
      });

      const { valid, reason } = await res.json();

      if (valid) {
        onComplete(file);
      } else {
        setRejectReason(reason);
        setPhase("rejected");
      }
    } catch {
      setRejectReason("Something went wrong. Please try again.");
      setPhase("rejected");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setRejectReason(null);
    if (inputRef.current) inputRef.current.value = "";
    setPhase("upload");
  };

  if (phase === "upload") return (
    <div>
      <p className="text-sm text-gray-400 mb-3">Upload proof that you completed this step</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? "border-violet-400 bg-violet-500/10" : "border-gray-700 hover:border-gray-500"}`}
      >
        <p className="text-white font-medium mb-1">Drop image here or click to browse</p>
        <p className="text-gray-500 text-sm">JPG or PNG · max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );

  if (phase === "preview") return (
    <div>
      <img
        src={preview!}
        alt="Proof preview"
        className="w-full max-h-64 object-contain rounded-xl bg-gray-800 mb-3"
      />
      <p className="text-gray-500 text-xs mb-4">
        {file?.name} · {((file?.size ?? 0) / 1024).toFixed(0)} KB
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 rounded-2xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all font-medium"
        >
          Replace
        </button>
        <button
          onClick={handleConfirm}
          className="flex-2 flex-grow py-3 rounded-2xl font-bold text-white
                     bg-gradient-to-r from-violet-500 to-fuchsia-500
                     hover:from-violet-600 hover:to-fuchsia-600 transition-all"
        >
          Confirm & continue
        </button>
      </div>
    </div>
  );

  if (phase === "verifying") return (
    <div className="text-center py-6">
      <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-300 font-medium">Verifying your proof...</p>
      <p className="text-gray-500 text-sm mt-1">This usually takes a few seconds</p>
    </div>
  );

  if (phase === "rejected") return (
    <div>
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 text-left">
        <p className="text-red-400 font-medium mb-1">Proof not accepted</p>
        <p className="text-gray-400 text-sm">{rejectReason}</p>
      </div>
      <button
        onClick={handleReset}
        className="w-full py-3 rounded-2xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all font-medium"
      >
        Try again with a different image
      </button>
    </div>
  );
}