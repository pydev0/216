import { NextRequest, NextResponse } from "next/server";
import { getUserSongs, addUserSong } from "@/lib/db";
import { extractYouTubeId } from "@/lib/youtube";

export async function GET() {
  try {
    const songs = getUserSongs();
    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Songs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_url, country_tag, title, added_by } = body;

    if (!youtube_url || typeof youtube_url !== "string") {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    if (!country_tag || typeof country_tag !== "string") {
      return NextResponse.json({ error: "Country tag is required" }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtube_url);
    if (!youtubeId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const song = addUserSong({
      youtube_url,
      youtube_id: youtubeId,
      country_tag,
      title: title || null,
      added_by: added_by || null,
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error("Songs POST error:", error);
    return NextResponse.json({ error: "Failed to add song" }, { status: 500 });
  }
}
