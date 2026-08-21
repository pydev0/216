import { NextResponse } from "next/server";
import { getUnclaimedUsers } from "@/lib/db";

export async function GET() {
  const users = getUnclaimedUsers();
  return NextResponse.json({ users });
}
