import { NextRequest, NextResponse } from "next/server";
import { getUserByName } from "@/lib/db";
import { verifyPassword, createUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: "Name and password are required" }, { status: 400 });
    }

    const user = getUserByName(name);
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid name or password" }, { status: 401 });
    }

    await createUserSession(user.id);

    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
