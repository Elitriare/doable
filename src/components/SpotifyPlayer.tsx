"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isSpotifyConnected,
  startSpotifyAuth,
  exchangeCodeForToken,
  disconnectSpotify,
  getPlaybackState,
  playPause,
  skipNext,
  skipPrevious,
  SpotifyPlayback,
} from "@/lib/spotify";

export default function SpotifyPlayer() {
  const [connected, setConnected] = useState(false);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Check connection & handle callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("spotify_code");

    if (code) {
      exchangeCodeForToken(code).then((ok) => {
        if (ok) setConnected(true);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    } else {
      setConnected(isSpotifyConnected());
    }
  }, []);

  // Poll playback state every 2s
  const pollPlayback = useCallback(async () => {
    if (!connected) return;
    const state = await getPlaybackState();
    setPlayback(state);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    pollPlayback();
    const interval = setInterval(pollPlayback, 2000);
    return () => clearInterval(interval);
  }, [connected, pollPlayback]);

  const handlePlayPause = async () => {
    await playPause();
    // Optimistic update
    if (playback) setPlayback({ ...playback, isPlaying: !playback.isPlaying });
    setTimeout(pollPlayback, 300);
  };

  const handleNext = async () => {
    await skipNext();
    setTimeout(pollPlayback, 500);
  };

  const handlePrev = async () => {
    await skipPrevious();
    setTimeout(pollPlayback, 500);
  };

  const handleDisconnect = () => {
    disconnectSpotify();
    setConnected(false);
    setPlayback(null);
    setExpanded(false);
  };

  // Not connected — show small connect button
  if (!connected) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={startSpotifyAuth}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full
          bg-white/80 backdrop-blur-sm border border-[#b8d4ed] shadow-lg
          text-[#1f3a5c] text-sm font-medium hover:bg-white transition-all cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        Connect Spotify
      </motion.button>
    );
  }

  // Minimized — just a small circle
  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm
          border border-[#b8d4ed] shadow-lg flex items-center justify-center cursor-pointer hover:bg-white transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </motion.button>
    );
  }

  // Connected — floating player
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-5 right-5 z-50"
      >
        <div className="bg-white/90 backdrop-blur-md border border-[#b8d4ed] rounded-2xl shadow-xl overflow-hidden"
          style={{ width: expanded ? 280 : 220 }}
        >
          {/* Main player */}
          <div className="flex items-center gap-3 p-3">
            {/* Album art */}
            {playback?.albumArt ? (
              <img
                src={playback.albumArt}
                alt="Album"
                className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-[#dce8f5] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5a7fa8">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}

            {/* Track info */}
            <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
              <p className="text-sm font-semibold text-[#1f3a5c] truncate cursor-pointer">
                {playback?.trackName || "Nothing playing"}
              </p>
              <p className="text-xs text-[#5a7fa8] truncate">
                {playback?.artistName || "Play something on Spotify"}
              </p>
            </div>

            {/* Minimize button */}
            <button
              onClick={() => setMinimized(true)}
              className="text-[#5a7fa8] hover:text-[#1f3a5c] transition-colors cursor-pointer p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13H5v-2h14v2z"/>
              </svg>
            </button>
          </div>

          {/* Controls */}
          {playback && (
            <div className="px-3 pb-3">
              {/* Progress bar */}
              <div className="w-full h-1 bg-[#dce8f5] rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-[#4a8fe7] rounded-full transition-all duration-1000"
                  style={{ width: `${(playback.progressMs / playback.durationMs) * 100}%` }}
                />
              </div>

              {/* Playback buttons */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={handlePrev} className="text-[#5a7fa8] hover:text-[#1f3a5c] transition-colors cursor-pointer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-9 h-9 rounded-full bg-[#4a8fe7] text-white flex items-center justify-center hover:bg-[#3a7dd4] transition-all cursor-pointer"
                >
                  {playback.isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
                <button onClick={handleNext} className="text-[#5a7fa8] hover:text-[#1f3a5c] transition-colors cursor-pointer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Expanded: disconnect option */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[#dce8f5] overflow-hidden"
              >
                <button
                  onClick={handleDisconnect}
                  className="w-full px-3 py-2 text-xs text-[#5a7fa8] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer text-center"
                >
                  Disconnect Spotify
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
