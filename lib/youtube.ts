export async function searchYouTubeVideo(
  trackName: string,
  artistName: string
): Promise<string | null> {
  try {
    const { default: yts } = await import("yt-search");
    const query = `${trackName} ${artistName} official audio`;
    const result = await yts(query);
    if (result.videos.length > 0) {
      return result.videos[0].videoId;
    }
    return null;
  } catch {
    console.error(`YouTube search failed for: ${trackName} - ${artistName}`);
    return null;
  }
}

export interface YouTubeOembed {
  title: string;
  authorName: string;
  thumbnail: string;
}

export async function getYouTubeOembed(youtubeId: string): Promise<YouTubeOembed | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${youtubeId}`
    )}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? "",
      authorName: data.author_name ?? "",
      thumbnail: data.thumbnail_url ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
