const CLIENT_ID = "7dd174111d2d475db97917dd234f5841";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

const REDIRECT_URI =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000/api/spotify/callback"
    : "https://doable-mu.vercel.app/api/spotify/callback";

// PKCE helpers
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlEncode(hashed);

  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<boolean> {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) return false;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  localStorage.setItem("spotify_access_token", data.access_token);
  localStorage.setItem("spotify_refresh_token", data.refresh_token);
  localStorage.setItem("spotify_token_expiry", String(Date.now() + data.expires_in * 1000));
  sessionStorage.removeItem("spotify_code_verifier");
  return true;
}

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("spotify_refresh_token");
  if (!refresh) return false;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  localStorage.setItem("spotify_access_token", data.access_token);
  if (data.refresh_token) localStorage.setItem("spotify_refresh_token", data.refresh_token);
  localStorage.setItem("spotify_token_expiry", String(Date.now() + data.expires_in * 1000));
  return true;
}

async function getToken(): Promise<string | null> {
  const expiry = Number(localStorage.getItem("spotify_token_expiry") || "0");
  if (Date.now() > expiry - 60000) {
    const ok = await refreshToken();
    if (!ok) return null;
  }
  return localStorage.getItem("spotify_access_token");
}

export function isSpotifyConnected(): boolean {
  return !!localStorage.getItem("spotify_access_token");
}

export function disconnectSpotify(): void {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  localStorage.removeItem("spotify_token_expiry");
}

export interface SpotifyPlayback {
  isPlaying: boolean;
  trackName: string;
  artistName: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
}

export async function getPlaybackState(): Promise<SpotifyPlayback | null> {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204 || !res.ok) return null;

  const data = await res.json();
  if (!data.item) return null;

  return {
    isPlaying: data.is_playing,
    trackName: data.item.name,
    artistName: data.item.artists.map((a: { name: string }) => a.name).join(", "),
    albumArt: data.item.album.images?.[0]?.url || "",
    progressMs: data.progress_ms || 0,
    durationMs: data.item.duration_ms || 0,
  };
}

export async function playPause(): Promise<void> {
  const token = await getToken();
  if (!token) return;

  const state = await getPlaybackState();
  const endpoint = state?.isPlaying
    ? "https://api.spotify.com/v1/me/player/pause"
    : "https://api.spotify.com/v1/me/player/play";

  await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function skipNext(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/next", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function skipPrevious(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  await fetch("https://api.spotify.com/v1/me/player/previous", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
