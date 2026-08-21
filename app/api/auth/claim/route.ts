import { NextRequest, NextResponse } from "next/server";
import { getUserById, claimUser } from "@/lib/db";
import { hashPassword, createUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { user_id, password } = await request.json();

    if (!user_id || !password || typeof password !== "string") {
      return NextResponse.json({ error: "User ID and password are required" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const user = getUserById(user_id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password_hash) {
      return NextResponse.json({ error: "This account has already been claimed" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const claimed = claimUser(user_id, hash);
    if (!claimed) {
      return NextResponse.json({ error: "Failed to claim account" }, { status: 409 });
    }

    await createUserSession(user.id);

    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Failed to claim account" }, { status: 500 });
  }
}
