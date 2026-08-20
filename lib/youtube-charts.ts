const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

// ISO 3166-1 alpha-2 region codes
const COUNTRY_CODES: Record<string, string> = {
  Romania: "RO",
  Ukraine: "UA",
  India: "IN",
  "United Kingdom": "GB",
  "Sri Lanka": "LK",
  "United States": "US",
};

export const COUNTRIES = Object.keys(COUNTRY_CODES);

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeHtml(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (m) => HTML_ENTITIES[m] || m);
}

export interface ChartTrack {
  trackName: string;
  artistName: string;
  albumArt: string | null;
  youtubeId: string;
}

export type Period = "week" | "month" | "year";

function getCutoffDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "week":
      now.setDate(now.getDate() - 7);
      break;
    case "month":
      now.setMonth(now.getMonth() - 1);
      break;
    case "year":
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now;
}

interface VideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

export async function fetchTopTracks(country: string, period: Period = "week"): Promise<ChartTrack[]> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const regionCode = COUNTRY_CODES[country];
  if (!regionCode) throw new Error(`No region code for ${country}`);

  // Use mostPopular for all periods (1 quota unit per call vs 100 for search)
  // Fetch 50 results (max) and filter by publishedAt date for month/year
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    regionCode,
    videoCategoryId: "10",
    maxResults: "50",
    key: API_KEY,
  });

  const res = await fetch(`${BASE_URL}/videos?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (!Array.isArray(data.items)) {
    throw new Error(`Unexpected YouTube API response for ${country}`);
  }

  const cutoff = getCutoffDate(period);
  let items: VideoItem[] = data.items;

  // For week/month, filter by publish date; for year, nearly everything passes
  if (period !== "year") {
    items = items.filter(
      (item: VideoItem) => new Date(item.snippet.publishedAt) >= cutoff
    );
  }

  // Take top 20 after filtering
  return items.slice(0, 20).map((item: VideoItem) => ({
    trackName: decodeHtml(item.snippet.title),
    artistName: decodeHtml(item.snippet.channelTitle),
    albumArt:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      null,
    youtubeId: item.id,
  }));
}
