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
  canDelete?: boolean;
  onDelete?: () => void;
}

export function TrackCard({
  trackName,
  artist,
  albumArt,
  youtubeId,
  addedBy,
  addedAt,
  onPlay,
  canDelete,
  onDelete,
}: TrackCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
      <CardContent className="p-0 relative">
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
          <div className="flex-1 min-w-0 pr-6">
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
        {canDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete song"
            className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
