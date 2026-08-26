import { NextResponse } from "next/server";
import { getUserSongById, deleteUserSong } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid song id" }, { status: 400 });
    }

    const song = await getUserSongById(id);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const isOwner = song.added_by?.toLowerCase() === user.name.toLowerCase();
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not allowed to delete this song" }, { status: 403 });
    }

    await deleteUserSong(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Song DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 });
  }
}
