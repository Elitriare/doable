"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getPoints } from "@/lib/storage";
import { PointEvent } from "@/types";

interface LeaderboardEntry {
  displayName: string;
  avatarUrl: string;
  points: number;
  isYou: boolean;
}

export default function Leaderboard() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [pointsHistory, setPointsHistory] = useState<PointEvent[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const localPoints = typeof window !== "undefined" ? getPoints() : 0;

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) return;
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setFriendCode(data.friendCode || "");
      setPointsHistory((data.pointsHistory || []).reverse());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    fetchLeaderboard();
  }, [session]);

  const handleAddFriend = async () => {
    if (!inputCode.trim()) return;
    setAddError("");
    setAddSuccess("");

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", friendCode: inputCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add friend");
        return;
      }
      setAddSuccess(`Added ${data.friend.displayName}!`);
      setInputCode("");
      fetchLeaderboard();
      setTimeout(() => setAddSuccess(""), 3000);
    } catch {
      setAddError("Network error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reasonLabel = (reason: string) => {
    switch (reason) {
      case "step_complete": return "Step completed";
      case "task_complete": return "Task finished";
      case "streak_bonus": return "Streak bonus";
      case "first_today": return "First task today";
      case "forfeit": return "Task forfeited";
      default: return reason;
    }
  };

  const myPoints = leaderboard.find((e) => e.isYou)?.points ?? localPoints;

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Score Card */}
      <div className="text-center bg-gradient-to-br from-[#4a8fe7] to-[#2e6dc0] rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-center gap-3 mb-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-white/50"
            />
          )}
          <div className="text-left">
            <p className="text-sm text-white/80">Your Score</p>
            <p className="text-4xl font-bold tabular-nums">{myPoints}</p>
          </div>
        </div>

        {/* Friend Code */}
        {friendCode && (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-2 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-white/70">Your friend code</p>
              <p className="text-lg font-mono font-bold tracking-widest">{friendCode}</p>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all cursor-pointer font-medium"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* Add Friend */}
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#b8d4ed] p-4">
        <p className="text-sm font-semibold text-[#1f3a5c] mb-2">Add a friend</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value.toUpperCase());
              setAddError("");
            }}
            placeholder="Enter friend code"
            maxLength={6}
            className="flex-1 px-4 py-2 rounded-xl border border-[#b8d4ed] bg-white text-[#1f3a5c] text-sm font-mono tracking-widest uppercase placeholder:text-[#5a7fa8] placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
          />
          <button
            onClick={handleAddFriend}
            disabled={inputCode.length < 4}
            className="px-5 py-2 rounded-xl font-bold text-sm text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Add
          </button>
        </div>
        {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
        {addSuccess && <p className="text-xs text-green-600 mt-2">{addSuccess}</p>}
      </div>

      {/* Leaderboard */}
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#b8d4ed] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#b8d4ed]">
          <p className="text-sm font-semibold text-[#1f3a5c]">Leaderboard</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#4a8fe7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#5a7fa8]">
            Add friends to start competing!
          </div>
        ) : (
          <div className="divide-y divide-[#b8d4ed]/50">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  entry.isYou ? "bg-[#e8f1fb]/60" : ""
                }`}
              >
                {/* Rank */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0
                    ? "bg-yellow-400 text-yellow-900"
                    : i === 1
                    ? "bg-gray-300 text-gray-700"
                    : i === 2
                    ? "bg-amber-600 text-amber-100"
                    : "bg-[#b8d4ed]/50 text-[#5a7fa8]"
                }`}>
                  {i + 1}
                </div>

                {/* Avatar */}
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#b8d4ed] flex items-center justify-center text-xs font-bold text-[#1f3a5c] shrink-0">
                    {entry.displayName[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.isYou ? "text-[#4a8fe7]" : "text-[#1f3a5c]"}`}>
                    {entry.displayName} {entry.isYou && "(you)"}
                  </p>
                </div>

                {/* Points */}
                <p className="text-sm font-bold tabular-nums text-[#1f3a5c]">
                  {entry.points} <span className="text-xs font-normal text-[#5a7fa8]">pts</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points History */}
      {pointsHistory.length > 0 && (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-[#b8d4ed] overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/50 transition-colors"
          >
            <p className="text-sm font-semibold text-[#1f3a5c]">Recent Activity</p>
            <span className={`text-[#5a7fa8] text-sm transition-transform ${showHistory ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {showHistory && (
            <div className="divide-y divide-[#b8d4ed]/50 border-t border-[#b8d4ed]">
              {pointsHistory.slice(0, 15).map((event, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#1f3a5c] truncate">{event.taskTitle}</p>
                    <p className="text-xs text-[#5a7fa8]">{reasonLabel(event.reason)}</p>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ml-3 ${
                      event.delta > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {event.delta > 0 ? "+" : ""}{event.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* How points work */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-xs text-[#5a7fa8]">
          +10 per step | +25 task bonus | +5/streak day | +10 first today
        </p>
        <p className="text-xs text-[#5a7fa8]">
          Forfeit = -15 pts. Keep your streak alive!
        </p>
      </div>
    </div>
  );
}
