import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSongsByName, getUserAvatar } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const songCount = getUserSongsByName(user.name).length;
  const avatar = getUserAvatar(user.id);
  return NextResponse.json({ user: { ...user, song_count: songCount, avatar } });
}
