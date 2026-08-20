"use client";

import { Card, CardContent } from "@/components/ui/card";

interface TrackCardProps {
  trackName: string;
  artist: string;
  albumArt: string | null;
  youtubeId: string | null;
  country: string;
  addedBy?: string | null;
  addedAt?: number | null;
  onPlay?: (youtubeId: string, trackName: string, artist: string) => void;
}

export function TrackCard({
  trackName,
  artist,
  albumArt,
  youtubeId,
  addedBy,
  addedAt,
  onPlay,
}: TrackCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
      <CardContent className="p-0">
        <button
          onClick={() => youtubeId && onPlay?.(youtubeId, trackName, artist)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {albumArt ? (
            <img
              src={albumArt}
              alt={trackName}
              className="w-14 h-14 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded bg-muted flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{trackName}</p>
            <p className="text-sm text-muted-foreground truncate">{artist}</p>
            {addedBy && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Added by {addedBy}
                {addedAt && ` \u00B7 ${new Date(addedAt * 1000).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
