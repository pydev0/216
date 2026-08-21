import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getUserById, updateUserPassword } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (new_password.length < 4) {
    return NextResponse.json(
      { error: "New password must be at least 4 characters" },
      { status: 400 }
    );
  }

  const dbUser = getUserById(user.id);
  if (!dbUser || !dbUser.password_hash) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await verifyPassword(current_password, dbUser.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 403 }
    );
  }

  const newHash = await hashPassword(new_password);
  updateUserPassword(user.id, newHash);

  return NextResponse.json({ success: true });
}
