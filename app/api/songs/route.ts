import { NextRequest, NextResponse } from "next/server";
import { getUserSongs, addUserSong } from "@/lib/db";
import { extractYouTubeId } from "@/lib/youtube";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const songs = await getUserSongs();
    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Songs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtube_url, country_tag, title } = body;

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

    const song = await addUserSong({
      youtube_url,
      youtube_id: youtubeId,
      country_tag,
      title: title || null,
      added_by: user.name,
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error("Songs POST error:", error);
    return NextResponse.json({ error: "Failed to add song" }, { status: 500 });
  }
}
