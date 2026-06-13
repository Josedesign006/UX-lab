import crypto from "crypto";
import { cookies } from "next/headers";
import {
  createSessionRecord,
  deleteSession,
  getSession,
  getUserById,
  Session,
  uid,
  User,
} from "./db";
import { Study } from "./types";

export const SESSION_COOKIE = "uxlab_session";
const SESSION_DAYS = 30;

// ---------- passwords (scrypt, per-user salt, constant-time compare) ----------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

// ---------- sessions ----------

export async function createSession(userId: string): Promise<Session> {
  const session: Session = {
    token: crypto.randomBytes(32).toString("hex"),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86400e3).toISOString(),
  };
  await createSessionRecord(session);
  return session;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const, // not readable from JS — XSS can't steal it
    sameSite: "lax" as const, // CSRF mitigation
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

/** Current logged-in user, resolved from the session cookie. */
export async function currentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return (await getUserById(session.userId)) ?? null;
}

export async function logout() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
}

/** Does this user own (or have legacy access to) the study? */
export function canAccessStudy(user: User | null, study: Study): boolean {
  if (!study.ownerId) return user !== null; // legacy/demo studies: any signed-in user
  return user !== null && user.id === study.ownerId;
}

export function newUserId() {
  return uid("u");
}
