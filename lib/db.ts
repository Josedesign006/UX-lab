import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { Study, StudyResponse, StudyStatus, StudyType } from "./types";

/**
 * Lightweight study row for list views (dashboard). Deliberately omits the
 * heavy `config` (which can hold megabytes of inline data-URL screenshots),
 * so listing studies stays fast no matter how large each study gets.
 */
export interface StudySummary {
  id: string;
  type: StudyType;
  name: string;
  status: StudyStatus;
  updatedAt: string;
}

/** Aggregated response metrics for one study, used by the dashboard. */
export interface ResponseStat {
  count: number;
  /** responses completed in the last 7 days */
  week: number;
  /** ISO timestamp of the most recent response, or null */
  lastAt: string | null;
  /** mean response duration in ms, or null when unknown */
  avgMs: number | null;
}

export interface User {
  id: string;
  email: string;
  /** scrypt: salthex:hashhex. Empty for Google-only accounts (no password). */
  passwordHash: string;
  /** Google "sub" id, set when the account signs in with Google. */
  googleId?: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface PasswordReset {
  token: string;
  userId: string;
  expiresAt: string;
}

export function uid(prefix = ""): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

/**
 * Storage backends. With DATABASE_URL (or POSTGRES_URL) set, everything
 * lives in Postgres — required on serverless hosts like Vercel, where the
 * filesystem is ephemeral. Without it, the original data/db.json file store
 * is used, so local dev / VM / Docker need zero configuration.
 */
interface Store {
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  setUserGoogleId(userId: string, googleId: string): Promise<void>;
  setUserPassword(userId: string, passwordHash: string): Promise<void>;
  createSessionRecord(session: Session): Promise<void>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  createPasswordReset(reset: PasswordReset): Promise<void>;
  getPasswordReset(token: string): Promise<PasswordReset | undefined>;
  deletePasswordReset(token: string): Promise<void>;
  listStudies(ownerId?: string): Promise<Study[]>;
  listStudySummaries(ownerId?: string): Promise<StudySummary[]>;
  getStudy(id: string): Promise<Study | undefined>;
  createStudy(study: Study): Promise<Study>;
  updateStudy(id: string, patch: Partial<Study>): Promise<Study | undefined>;
  deleteStudy(id: string): Promise<void>;
  listResponses(studyId: string): Promise<StudyResponse[]>;
  countResponses(): Promise<Record<string, number>>;
  responseStats(): Promise<Record<string, ResponseStat>>;
  addResponse(resp: StudyResponse): Promise<StudyResponse>;
  deleteResponse(studyId: string, responseId: string): Promise<void>;
}

// ---------- JSON file backend ----------

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface FileDB {
  users: User[];
  sessions: Session[];
  studies: Study[];
  responses: StudyResponse[];
  passwordResets: PasswordReset[];
}

// The db.json file can grow to several MB (prototype/first-click studies embed
// data-URL images). Re-reading + JSON.parsing it on every operation made each
// request do many MB of work. Since this server is the only writer, keep the
// parsed DB in memory and write through on save().
let cache: FileDB | null = null;

function load(): FileDB {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    cache = {
      users: db.users ?? [],
      sessions: db.sessions ?? [],
      studies: db.studies ?? [],
      responses: db.responses ?? [],
      passwordResets: db.passwordResets ?? [],
    };
  } catch {
    cache = {
      users: [],
      sessions: [],
      studies: [],
      responses: [],
      passwordResets: [],
    };
  }
  return cache;
}

function save(db: FileDB) {
  cache = db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

const fileStore: Store = {
  async getUserByEmail(email) {
    return load().users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  },
  async getUserById(id) {
    return load().users.find((u) => u.id === id);
  },
  async getUserByGoogleId(googleId) {
    return load().users.find((u) => u.googleId === googleId);
  },
  async createUser(user) {
    const db = load();
    db.users.push(user);
    save(db);
    return user;
  },
  async setUserGoogleId(userId, googleId) {
    const db = load();
    const u = db.users.find((x) => x.id === userId);
    if (u) u.googleId = googleId;
    save(db);
  },
  async setUserPassword(userId, passwordHash) {
    const db = load();
    const u = db.users.find((x) => x.id === userId);
    if (u) u.passwordHash = passwordHash;
    save(db);
  },
  async createSessionRecord(session) {
    const db = load();
    const now = new Date().toISOString();
    db.sessions = db.sessions.filter((s) => s.expiresAt > now);
    db.sessions.push(session);
    save(db);
  },
  async getSession(token) {
    const s = load().sessions.find((x) => x.token === token);
    if (!s || s.expiresAt <= new Date().toISOString()) return undefined;
    return s;
  },
  async deleteSession(token) {
    const db = load();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    save(db);
  },
  async createPasswordReset(reset) {
    const db = load();
    const now = new Date().toISOString();
    db.passwordResets = db.passwordResets.filter((r) => r.expiresAt > now);
    db.passwordResets.push(reset);
    save(db);
  },
  async getPasswordReset(token) {
    const r = load().passwordResets.find((x) => x.token === token);
    if (!r || r.expiresAt <= new Date().toISOString()) return undefined;
    return r;
  },
  async deletePasswordReset(token) {
    const db = load();
    db.passwordResets = db.passwordResets.filter((r) => r.token !== token);
    save(db);
  },
  async listStudies(ownerId) {
    return load()
      .studies.filter((s) => !ownerId || !s.ownerId || s.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async listStudySummaries(ownerId) {
    return load()
      .studies.filter((s) => !ownerId || !s.ownerId || s.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        status: s.status,
        updatedAt: s.updatedAt,
      }));
  },
  async getStudy(id) {
    return load().studies.find((s) => s.id === id);
  },
  async createStudy(study) {
    const db = load();
    db.studies.push(study);
    save(db);
    return study;
  },
  async updateStudy(id, patch) {
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
  },
  async deleteStudy(id) {
    const db = load();
    db.studies = db.studies.filter((s) => s.id !== id);
    db.responses = db.responses.filter((r) => r.studyId !== id);
    save(db);
  },
  async listResponses(studyId) {
    return load()
      .responses.filter((r) => r.studyId === studyId)
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  },
  async countResponses() {
    const counts: Record<string, number> = {};
    for (const r of load().responses) {
      counts[r.studyId] = (counts[r.studyId] ?? 0) + 1;
    }
    return counts;
  },
  async responseStats() {
    const since = new Date(Date.now() - 7 * 86400e3).toISOString();
    const acc: Record<string, { count: number; week: number; lastAt: string | null; sum: number; durN: number }> = {};
    for (const r of load().responses) {
      const s = (acc[r.studyId] ??= { count: 0, week: 0, lastAt: null, sum: 0, durN: 0 });
      s.count++;
      if (r.completedAt >= since) s.week++;
      if (!s.lastAt || r.completedAt > s.lastAt) s.lastAt = r.completedAt;
      if (typeof r.durationMs === "number") {
        s.sum += r.durationMs;
        s.durN++;
      }
    }
    const out: Record<string, ResponseStat> = {};
    for (const [id, s] of Object.entries(acc)) {
      out[id] = {
        count: s.count,
        week: s.week,
        lastAt: s.lastAt,
        avgMs: s.durN ? s.sum / s.durN : null,
      };
    }
    return out;
  },
  async addResponse(resp) {
    const db = load();
    const n = db.responses.filter((r) => r.studyId === resp.studyId).length;
    resp.participant = "P" + (n + 1);
    db.responses.push(resp);
    save(db);
    return resp;
  },
  async deleteResponse(studyId, responseId) {
    const db = load();
    db.responses = db.responses.filter(
      (r) => !(r.studyId === studyId && r.id === responseId)
    );
    save(db);
  },
};

// ---------- Postgres backend ----------

const PG_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS studies (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  updated_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS responses_study_idx ON responses(study_id);
`;

let pool: Pool | null = null;
let schemaReady: Promise<unknown> | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = new URL(PG_URL!);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    // pg >= 8.16 escalates sslmode=require in the URL to verify-full, which
    // rejects hosted poolers' certs (Supabase/Neon) — drive TLS from config
    url.searchParams.delete("sslmode");
    pool = new Pool({
      connectionString: url.toString(),
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

async function q(text: string, params?: unknown[]) {
  if (!schemaReady) schemaReady = getPool().query(SCHEMA);
  await schemaReady;
  return getPool().query(text, params);
}

function rowToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    email: r.email as string,
    passwordHash: (r.password_hash as string) ?? "",
    googleId: (r.google_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
  };
}

const pgStore: Store = {
  async getUserByEmail(email) {
    const { rows } = await q(
      "SELECT * FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },
  async getUserById(id) {
    const { rows } = await q("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },
  async getUserByGoogleId(googleId) {
    const { rows } = await q("SELECT * FROM users WHERE google_id = $1", [
      googleId,
    ]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },
  async createUser(user) {
    await q(
      "INSERT INTO users (id, email, password_hash, google_id, created_at) VALUES ($1,$2,$3,$4,$5)",
      [user.id, user.email, user.passwordHash, user.googleId ?? null, user.createdAt]
    );
    return user;
  },
  async setUserGoogleId(userId, googleId) {
    await q("UPDATE users SET google_id = $2 WHERE id = $1", [userId, googleId]);
  },
  async setUserPassword(userId, passwordHash) {
    await q("UPDATE users SET password_hash = $2 WHERE id = $1", [
      userId,
      passwordHash,
    ]);
  },
  async createSessionRecord(session) {
    await q("DELETE FROM sessions WHERE expires_at <= $1", [
      new Date().toISOString(),
    ]);
    await q(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)",
      [session.token, session.userId, session.expiresAt]
    );
  },
  async getSession(token) {
    const { rows } = await q("SELECT * FROM sessions WHERE token = $1", [token]);
    const r = rows[0];
    if (!r || (r.expires_at as string) <= new Date().toISOString())
      return undefined;
    return {
      token: r.token as string,
      userId: r.user_id as string,
      expiresAt: r.expires_at as string,
    };
  },
  async deleteSession(token) {
    await q("DELETE FROM sessions WHERE token = $1", [token]);
  },
  async createPasswordReset(reset) {
    await q("DELETE FROM password_resets WHERE expires_at <= $1", [
      new Date().toISOString(),
    ]);
    await q(
      "INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1,$2,$3)",
      [reset.token, reset.userId, reset.expiresAt]
    );
  },
  async getPasswordReset(token) {
    const { rows } = await q(
      "SELECT * FROM password_resets WHERE token = $1",
      [token]
    );
    const r = rows[0];
    if (!r || (r.expires_at as string) <= new Date().toISOString())
      return undefined;
    return {
      token: r.token as string,
      userId: r.user_id as string,
      expiresAt: r.expires_at as string,
    };
  },
  async deletePasswordReset(token) {
    await q("DELETE FROM password_resets WHERE token = $1", [token]);
  },
  async listStudies(ownerId) {
    const { rows } = await q(
      `SELECT data FROM studies
       WHERE $1::text IS NULL OR owner_id IS NULL OR owner_id = $1
       ORDER BY updated_at DESC`,
      [ownerId ?? null]
    );
    return rows.map((r) => r.data as Study);
  },
  async listStudySummaries(ownerId) {
    // Project just the fields the list view needs straight out of JSONB so we
    // never ship the (potentially multi-MB) screenshot payloads over the wire.
    const { rows } = await q(
      `SELECT id,
              updated_at,
              data->>'name'   AS name,
              data->>'type'   AS type,
              data->>'status' AS status
       FROM studies
       WHERE $1::text IS NULL OR owner_id IS NULL OR owner_id = $1
       ORDER BY updated_at DESC`,
      [ownerId ?? null]
    );
    return rows.map((r) => ({
      id: r.id as string,
      type: r.type as StudyType,
      name: r.name as string,
      status: r.status as StudyStatus,
      updatedAt: r.updated_at as string,
    }));
  },
  async getStudy(id) {
    const { rows } = await q("SELECT data FROM studies WHERE id = $1", [id]);
    return rows[0] ? (rows[0].data as Study) : undefined;
  },
  async createStudy(study) {
    await q(
      "INSERT INTO studies (id, owner_id, updated_at, data) VALUES ($1,$2,$3,$4)",
      [study.id, study.ownerId ?? null, study.updatedAt, JSON.stringify(study)]
    );
    return study;
  },
  async updateStudy(id, patch) {
    const existing = await this.getStudy(id);
    if (!existing) return undefined;
    const updated: Study = {
      ...existing,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await q(
      "UPDATE studies SET owner_id = $2, updated_at = $3, data = $4 WHERE id = $1",
      [id, updated.ownerId ?? null, updated.updatedAt, JSON.stringify(updated)]
    );
    return updated;
  },
  async deleteStudy(id) {
    await q("DELETE FROM responses WHERE study_id = $1", [id]);
    await q("DELETE FROM studies WHERE id = $1", [id]);
  },
  async listResponses(studyId) {
    const { rows } = await q(
      "SELECT data FROM responses WHERE study_id = $1 ORDER BY completed_at ASC",
      [studyId]
    );
    return rows.map((r) => r.data as StudyResponse);
  },
  async countResponses() {
    const { rows } = await q(
      "SELECT study_id, COUNT(*)::int AS n FROM responses GROUP BY study_id"
    );
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.study_id as string] = r.n as number;
    return counts;
  },
  async responseStats() {
    const since = new Date(Date.now() - 7 * 86400e3).toISOString();
    const { rows } = await q(
      `SELECT study_id,
              COUNT(*)::int AS n,
              COUNT(*) FILTER (WHERE completed_at >= $1)::int AS week_n,
              MAX(completed_at) AS last_at,
              AVG(NULLIF(data->>'durationMs', '')::numeric) AS avg_ms
       FROM responses
       GROUP BY study_id`,
      [since]
    );
    const out: Record<string, ResponseStat> = {};
    for (const r of rows) {
      out[r.study_id as string] = {
        count: r.n as number,
        week: r.week_n as number,
        lastAt: (r.last_at as string | null) ?? null,
        avgMs: r.avg_ms != null ? Number(r.avg_ms) : null,
      };
    }
    return out;
  },
  async addResponse(resp) {
    const { rows } = await q(
      "SELECT COUNT(*)::int AS n FROM responses WHERE study_id = $1",
      [resp.studyId]
    );
    resp.participant = "P" + ((rows[0].n as number) + 1);
    await q(
      "INSERT INTO responses (id, study_id, completed_at, data) VALUES ($1,$2,$3,$4)",
      [resp.id, resp.studyId, resp.completedAt, JSON.stringify(resp)]
    );
    return resp;
  },
  async deleteResponse(studyId, responseId) {
    await q("DELETE FROM responses WHERE study_id = $1 AND id = $2", [
      studyId,
      responseId,
    ]);
  },
};

// ---------- public API (backend chosen by env) ----------

const store: Store = PG_URL ? pgStore : fileStore;

export const getUserByEmail = (email: string) => store.getUserByEmail(email);
export const getUserById = (id: string) => store.getUserById(id);
export const getUserByGoogleId = (googleId: string) =>
  store.getUserByGoogleId(googleId);
export const createUser = (user: User) => store.createUser(user);
export const setUserGoogleId = (userId: string, googleId: string) =>
  store.setUserGoogleId(userId, googleId);
export const setUserPassword = (userId: string, passwordHash: string) =>
  store.setUserPassword(userId, passwordHash);
export const createSessionRecord = (s: Session) => store.createSessionRecord(s);
export const getSession = (token: string) => store.getSession(token);
export const deleteSession = (token: string) => store.deleteSession(token);
export const createPasswordReset = (r: PasswordReset) =>
  store.createPasswordReset(r);
export const getPasswordReset = (token: string) => store.getPasswordReset(token);
export const deletePasswordReset = (token: string) =>
  store.deletePasswordReset(token);
export const listStudies = (ownerId?: string) => store.listStudies(ownerId);
export const listStudySummaries = (ownerId?: string) =>
  store.listStudySummaries(ownerId);
export const getStudy = (id: string) => store.getStudy(id);
export const createStudy = (study: Study) => store.createStudy(study);
export const updateStudy = (id: string, patch: Partial<Study>) =>
  store.updateStudy(id, patch);
export const deleteStudy = (id: string) => store.deleteStudy(id);
export const listResponses = (studyId: string) => store.listResponses(studyId);
export const countResponses = () => store.countResponses();
export const responseStats = () => store.responseStats();
export const addResponse = (resp: StudyResponse) => store.addResponse(resp);
export const deleteResponse = (studyId: string, responseId: string) =>
  store.deleteResponse(studyId, responseId);
