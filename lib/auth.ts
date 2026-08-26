import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createSession as dbCreateSession,
  getSessionWithUser,
  deleteSession as dbDeleteSession,
} from "./db";

const SESSION_COOKIE = "session_token";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getCurrentUser(): Promise<{
  id: number;
  name: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSessionWithUser(token);
  if (!session) return null;

  return {
    id: session.user_id,
    name: session.user_name,
    role: session.user_role,
  };
}

export async function createUserSession(userId: number): Promise<void> {
  const token = generateToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;

  await dbCreateSession(token, userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await dbDeleteSession(token);
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}
