import { NextRequest, NextResponse } from "next/server";
import { getCharts, getChartsAge, saveCharts, type ChartTrack } from "@/lib/db";
import { fetchTopTracks, COUNTRIES, type Period } from "@/lib/youtube-charts";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const VALID_PERIODS = new Set(["week", "month", "year"]);

export async function GET(request: NextRequest) {
  try {
    const periodParam = request.nextUrl.searchParams.get("period") || "week";
    const period: Period = VALID_PERIODS.has(periodParam) ? (periodParam as Period) : "week";

    const oldest = await getChartsAge(period);
    const isStale = !oldest || Date.now() / 1000 - oldest > SEVEN_DAYS_MS / 1000;

    if (isStale) {
      const allTracks: Omit<ChartTrack, "id">[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const country of COUNTRIES) {
        try {
          const tracks = await fetchTopTracks(country, period);

          for (const st of tracks) {
            allTracks.push({
              country,
              track_name: st.trackName,
              artist: st.artistName,
              youtube_id: st.youtubeId,
              album_art: st.albumArt,
              period,
              fetched_at: now,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch charts for ${country}:`, err);
        }
      }

      if (allTracks.length > 0) {
        await saveCharts(allTracks, period);
      }
    }

    const charts = await getCharts(period);
    return NextResponse.json({ tracks: charts, countries: COUNTRIES });
  } catch (error) {
    console.error("Charts API error:", error);
    return NextResponse.json({ error: "Failed to fetch charts" }, { status: 500 });
  }
}
