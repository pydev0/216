"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CountryTabs } from "@/components/country-tabs";
import { TrackCard } from "@/components/track-card";
import { AddSongForm } from "@/components/add-song-form";
import { PeriodFilter, type Period } from "@/components/period-filter";
import { VideoModal } from "@/components/video-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthUser {
  id: number;
  name: string;
  role: string;
  song_count: number;
  avatar: string | null;
}

interface ChartTrack {
  id: number;
  country: string;
  track_name: string;
  artist: string;
  youtube_id: string | null;
  album_art: string | null;
  fetched_at: number;
}

interface UserSong {
  id: number;
  youtube_url: string;
  youtube_id: string;
  country_tag: string;
  title: string | null;
  artist: string | null;
  album_art: string | null;
  added_by: string | null;
  created_at: number;
}

interface NowPlaying {
  videoId: string;
  title: string;
  artist: string;
}

function AvatarDropdown({
  user,
  onLogout,
  onAvatarUpdate,
}: {
  user: AuthUser;
  onLogout: () => void;
  onAvatarUpdate: (avatar: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Close on click outside (but not when clicking inside a dialog portal)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !target.closest("[data-slot^='dialog']")
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatar) {
        onAvatarUpdate(data.avatar);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      setPwError("Must be at least 4 characters");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to change password");
      } else {
        setPwSuccess("Password changed!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwError("Something went wrong");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div ref={dropdownRef} className="absolute top-4 right-6 z-50">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative group"
      >
        <div className="rounded-full p-[2px] bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 transition-all hover:scale-105 hover:shadow-[0_0_12px_rgba(139,92,246,0.5)]">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-background" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-[280px] bg-popover/95 backdrop-blur-md rounded-xl ring-1 ring-white/10 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-5 flex flex-col items-center gap-3">
            {/* Large avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative group cursor-pointer"
              title="Click to change avatar"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-500/30 group-hover:ring-purple-400 transition-all"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white ring-2 ring-purple-500/30 group-hover:ring-purple-400 transition-all">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            {/* Name + role */}
            <div className="text-center">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {user.role}
              </span>
            </div>

            {/* Song count */}
            <div className="text-sm text-muted-foreground">
              {user.song_count} song{user.song_count !== 1 ? "s" : ""} added
            </div>
          </div>

          <div className="h-px bg-white/10 mx-4" />

          {/* Change Password (collapsible) */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => setPwOpen(!pwOpen)}
              className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Change Password
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${pwOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {pwOpen && (
              <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="dd-current-pw" className="text-xs">Current</Label>
                  <Input
                    id="dd-current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dd-new-pw" className="text-xs">New</Label>
                  <Input
                    id="dd-new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dd-confirm-pw" className="text-xs">Confirm</Label>
                  <Input
                    id="dd-confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                {pwSuccess && <p className="text-xs text-green-500">{pwSuccess}</p>}
                <Button type="submit" size="sm" className="w-full" disabled={pwLoading}>
                  {pwLoading ? "Changing..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>

          <div className="h-px bg-white/10 mx-4" />

          {/* Sign out */}
          <div className="p-4">
            <Button variant="ghost" size="sm" className="w-full" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [charts, setCharts] = useState<ChartTrack[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [view, setView] = useState<"charts" | "yourline">("charts");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"));
  }, [router]);

  const fetchCharts = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/charts?period=${p}`);
      if (!res.ok) throw new Error("Failed to load charts");
      const data = await res.json();
      setCharts(data.tracks || []);
      setCountries(data.countries || []);
    } catch {
      setError("Could not load charts. Please try again later.");
    }
  }, []);

  const fetchSongs = useCallback(async () => {
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) throw new Error("Failed to load songs");
      const data = await res.json();
      setUserSongs(data.songs || []);
    } catch {
      // Non-critical — user songs just won't show
    }
  }, []);

  const handleDeleteSong = useCallback(async (id: number) => {
    const prev = userSongs;
    setUserSongs((songs) => songs.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete song");
    } catch {
      setUserSongs(prev);
    }
  }, [userSongs]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchCharts(period), fetchSongs()]);
      setLoading(false);
    }
    load();
  }, [fetchCharts, fetchSongs, period]);

  const handlePlay = useCallback((videoId: string, title: string, artist: string) => {
    setNowPlaying({ videoId, title, artist });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleAvatarUpdate(avatar: string) {
    setUser((prev) => (prev ? { ...prev, avatar } : prev));
  }

  // When "All" is selected, interleave tracks round-robin by country for a mixed playlist
  const filteredCharts = (() => {
    if (selectedCountry !== "All") {
      return charts.filter((t) => t.country === selectedCountry);
    }
    const byCountry: Record<string, ChartTrack[]> = {};
    for (const t of charts) {
      (byCountry[t.country] ??= []).push(t);
    }
    const groups = Object.values(byCountry);
    if (groups.length === 0) return [];
    const maxLen = Math.max(...groups.map((g) => g.length));
    const mixed: ChartTrack[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const group of groups) {
        if (i < group.length) mixed.push(group[i]);
      }
    }
    return mixed;
  })();

  const filteredSongs =
    selectedCountry === "All"
      ? userSongs
      : userSongs.filter((s) => s.country_tag === selectedCountry);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative">
        <div className="max-w-full mx-auto px-6 py-8 text-center flex flex-col items-center">
          <h1 className="text-8xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-glow drop-shadow-[0_0_25px_rgba(139,92,246,0.4)] italic skew-x-[-8deg]">
            2/16
          </h1>
          <p className="mt-4 text-lg tracking-widest uppercase animate-fade-in bg-gradient-to-r from-purple-400/60 via-blue-300/80 to-purple-400/60 bg-clip-text text-transparent font-medium italic skew-x-[-4deg]">
            Share music. Discover together.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        {user && (
          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
            onAvatarUpdate={handleAvatarUpdate}
          />
        )}
      </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
          {/* View switcher */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 p-1.5 backdrop-blur-sm">
              {(
                [
                  { value: "charts", label: "Charts" },
                  { value: "yourline", label: "Your Line" },
                ] as const
              ).map((tab) => {
                const isActive = view === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setView(tab.value)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-400/20 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                        : "border border-transparent text-muted-foreground hover:text-foreground/80 hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {view === "charts" && (
            <>
              {/* Filters */}
              <div className="flex flex-col items-center gap-4">
                <PeriodFilter selected={period} onSelect={setPeriod} />
                {countries.length > 0 && (
                  <CountryTabs
                    countries={countries}
                    selected={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                )}
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <svg
                    className="h-8 w-8 animate-spin text-purple-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Loading charts...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-12 text-red-500">{error}</div>
              )}

              {/* Chart tracks */}
              {!loading && filteredCharts.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
                    Top Charts
                    {selectedCountry !== "All" && ` — ${selectedCountry}`}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCharts.map((track) => (
                      <TrackCard
                        key={`chart-${track.id}`}
                        trackName={track.track_name}
                        artist={track.artist}
                        albumArt={track.album_art}
                        youtubeId={track.youtube_id}
                        country={track.country}
                        onPlay={handlePlay}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {view === "yourline" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">Added by Your Line</h2>
                <AddSongForm onSongAdded={fetchSongs} />
              </div>

              {countries.length > 0 && (
                <div className="mb-5 flex justify-center">
                  <CountryTabs
                    countries={countries}
                    selected={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                </div>
              )}

              {filteredSongs.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSongs.map((song) => (
                    <TrackCard
                      key={`song-${song.id}`}
                      trackName={song.title || "Untitled"}
                      artist={song.artist || ""}
                      albumArt={song.album_art}
                      youtubeId={song.youtube_id}
                      country={song.country_tag}
                      addedBy={song.added_by}
                      addedAt={song.created_at}
                      onPlay={handlePlay}
                      canDelete={
                        !!user &&
                        (user.role === "admin" ||
                          song.added_by?.toLowerCase() === user.name.toLowerCase())
                      }
                      onDelete={() => handleDeleteSong(song.id)}
                    />
                  ))}
                </div>
              ) : (
                !loading && (
                  <p className="text-muted-foreground text-sm">
                    No songs added yet. Be the first to share a track!
                  </p>
                )
              )}
            </section>
          )}
        </main>

      {/* Video player modal */}
      {nowPlaying && (
        <VideoModal
          videoId={nowPlaying.videoId}
          title={nowPlaying.title}
          artist={nowPlaying.artist}
          onClose={() => setNowPlaying(null)}
        />
      )}
    </div>
  );
}
