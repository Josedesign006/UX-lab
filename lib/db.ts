import fs from "fs";
import path from "path";
import { Study, StudyResponse } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface User {
  id: string;
  email: string;
  /** scrypt: salthex:hashhex — never stored in plaintext */
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

interface DB {
  users: User[];
  sessions: Session[];
  studies: Study[];
  responses: StudyResponse[];
}

function load(): DB {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    return {
      users: db.users ?? [],
      sessions: db.sessions ?? [],
      studies: db.studies ?? [],
      responses: db.responses ?? [],
    };
  } catch {
    return { users: [], sessions: [], studies: [], responses: [] };
  }
}

function save(db: DB) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

export function uid(prefix = ""): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

// ---------- Users & sessions ----------

export function getUserByEmail(email: string): User | undefined {
  return load().users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
}

export function getUserById(id: string): User | undefined {
  return load().users.find((u) => u.id === id);
}

export function createUser(user: User): User {
  const db = load();
  db.users.push(user);
  save(db);
  return user;
}

export function createSessionRecord(session: Session) {
  const db = load();
  // prune expired sessions while we're here
  const now = new Date().toISOString();
  db.sessions = db.sessions.filter((s) => s.expiresAt > now);
  db.sessions.push(session);
  save(db);
}

export function getSession(token: string): Session | undefined {
  const s = load().sessions.find((x) => x.token === token);
  if (!s || s.expiresAt <= new Date().toISOString()) return undefined;
  return s;
}

export function deleteSession(token: string) {
  const db = load();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  save(db);
}

// ---------- Studies ----------

/** Studies owned by a user (legacy ownerless studies are visible to all). */
export function listStudies(ownerId?: string): Study[] {
  return load()
    .studies.filter((s) => !ownerId || !s.ownerId || s.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getStudy(id: string): Study | undefined {
  return load().studies.find((s) => s.id === id);
}

export function createStudy(study: Study): Study {
  const db = load();
  db.studies.push(study);
  save(db);
  return study;
}

export function updateStudy(id: string, patch: Partial<Study>): Study | undefined {
  const db = load();
  const idx = db.studies.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  db.studies[idx] = {
    ...db.studies[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  save(db);
  return db.studies[idx];
}

export function deleteStudy(id: string) {
  const db = load();
  db.studies = db.studies.filter((s) => s.id !== id);
  db.responses = db.responses.filter((r) => r.studyId !== id);
  save(db);
}

// ---------- Responses ----------

export function listResponses(studyId: string): StudyResponse[] {
  return load()
    .responses.filter((r) => r.studyId === studyId)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export function countResponses(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of load().responses) {
    counts[r.studyId] = (counts[r.studyId] ?? 0) + 1;
  }
  return counts;
}

export function addResponse(resp: StudyResponse): StudyResponse {
  const db = load();
  const n = db.responses.filter((r) => r.studyId === resp.studyId).length;
  resp.participant = "P" + (n + 1);
  db.responses.push(resp);
  save(db);
  return resp;
}

export function deleteResponse(studyId: string, responseId: string) {
  const db = load();
  db.responses = db.responses.filter(
    (r) => !(r.studyId === studyId && r.id === responseId)
  );
  save(db);
}
