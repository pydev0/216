"use client";

import { useEffect, useState, useCallback } from "react";
import { CountryTabs } from "@/components/country-tabs";
import { TrackCard } from "@/components/track-card";
import { AddSongForm } from "@/components/add-song-form";
import { PeriodFilter, type Period } from "@/components/period-filter";
import { VideoModal } from "@/components/video-modal";

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
  added_by: string | null;
  created_at: number;
}

interface NowPlaying {
  videoId: string;
  title: string;
  artist: string;
}

export default function Home() {
  const [charts, setCharts] = useState<ChartTrack[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);

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
    <div className="min-h-screen bg-background">
      <header className="relative">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center flex flex-col items-center">
          <h1 className="text-8xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-glow drop-shadow-[0_0_25px_rgba(139,92,246,0.4)] italic skew-x-[-8deg]">
            2/16
          </h1>
          <p className="mt-4 text-lg tracking-widest uppercase animate-fade-in bg-gradient-to-r from-purple-400/60 via-blue-300/80 to-purple-400/60 bg-clip-text text-transparent font-medium italic skew-x-[-4deg]">
            Share music. Discover together.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
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

        {/* User-added songs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">Added by Your Line</h2>
            <AddSongForm onSongAdded={fetchSongs} />
          </div>

          {filteredSongs.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSongs.map((song) => (
                <TrackCard
                  key={`song-${song.id}`}
                  trackName={song.title || "Untitled"}
                  artist=""
                  albumArt={null}
                  youtubeId={song.youtube_id}
                  country={song.country_tag}
                  addedBy={song.added_by}
                  addedAt={song.created_at}
                  onPlay={handlePlay}
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
