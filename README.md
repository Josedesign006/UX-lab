# UXLab — open-source UX research platform

A self-hosted, MIT-licensed alternative to Optimal Workshop for running UX
research studies and analyzing the results. Card sorting with real
dendrograms, tree testing with pietrees, first-click heatmaps, surveys,
clickable-prototype tests and task-based usability testing — no SaaS, your
data stays on your server.

## Study types

| Method | Participant activity | Analysis |
| --- | --- | --- |
| 🗂️ **Card sorting** (open / closed / hybrid) | Drag-and-drop sorting board, create & name groups | Dendrogram (average-linkage clustering), similarity matrix, participant-category merge table, placement matrix |
| 🌳 **Tree testing** | Click-through tree navigation with breadcrumb backtracking | Success / directness / direct-success rates, outcome breakdown, destination table, first clicks, median time |
| 🎯 **First-click testing** | Task → image → first click captured (position + time) | Click heatmap & dot map overlays, time-to-click |
| 📋 **Surveys** | Text, choice, Likert, rating, ranking, numeric questions | Per-question charts, averages, answer lists, average rank |
| 📱 **Prototype testing** | Clickable image prototype (hotspots between screens) | Success / give-up rates, misclick rate, paths taken, per-screen click maps |
| 🧪 **Usability testing** | Task-based unmoderated testing on a live URL, SEQ + comments | Completion breakdown, average ease, time on task, comment review |

Every study also supports: welcome/instructions/thank-you messages, **pre-study
screener questions**, **post-study questions**, shuffle options, a shareable
participant link (`/p/<study-id>`), draft → live → closed lifecycle, response
management, and **raw CSV export**.

## Getting started

```bash
npm install
npm run seed   # optional: loads 4 demo studies with 30 responses
npm run dev    # http://localhost:3000
```

Demo account after seeding: `demo@uxlab.studio` / `demo1234`

## Accounts & security

- **Per-user workspaces** — every study has an `ownerId`; users only ever see
  and manage their own studies. Ownership is enforced server-side on every API
  route (list, read, update, delete, responses, export), not just in the UI.
- **Passwords** are hashed with `scrypt` (per-user random salt, constant-time
  comparison) — never stored or logged in plaintext.
- **Sessions** are 32-byte random tokens stored server-side with a 30-day
  expiry, delivered as `httpOnly` + `SameSite=Lax` cookies (JS can't read
  them; basic CSRF protection). `Secure` flag is enabled in production.
- **Login errors are uniform** — wrong email and wrong password return the
  same message, so accounts can't be enumerated.
- **Participant links stay anonymous** — `/p/<id>` needs no account, works
  only while a study is live, and respondents are stored under anonymous IDs
  (P1, P2…). No personal data is collected unless you ask for it in questions.

For production you'd additionally want HTTPS (terminate TLS in front),
a real database (Postgres/SQLite) instead of `data/db.json`, rate limiting on
auth endpoints, and encrypted backups.

## Deploying

The app needs a Node server with a persistent disk (studies live in
`data/db.json`). A `Dockerfile` and a `docker-compose.yml` (app + Caddy for
automatic HTTPS) are included:

```bash
echo 'UXLAB_DOMAIN=yourname.duckdns.org' > .env
docker compose up -d --build
```

Free options that work as-is (persistent disk included):

- **Oracle Cloud Always Free** — a free-forever ARM VM (up to 4 cores / 24GB).
  Full step-by-step walkthrough in [DEPLOY.md](DEPLOY.md).
- **Your own hardware** — any spare machine + a free
  [DuckDNS](https://www.duckdns.org) subdomain + Let's Encrypt.

Free options that need the JSON store swapped for Postgres first (serverless
filesystems are ephemeral — all data access lives in `lib/db.ts`, so it's a
one-file migration):

- **Vercel Hobby + Neon free Postgres** — zero-ops, free for non-commercial /
  open-source use.
- **Render free tier + Neon** — free, but the instance sleeps after 15 min of
  inactivity (cold starts ~1 min).

## License

MIT — see [LICENSE](LICENSE). Contributions welcome.

- **Researcher dashboard:** `/` — create, edit, launch, and analyze studies.
- **Participant link:** `/p/<study-id>` — share this; the study must be live.
- **Results:** open a study → 📊 Results (dendrograms, heatmaps, metrics, CSV).

## How it works

- Next.js 14 (App Router) + Tailwind, no external services.
- Data is stored in `data/db.json` (atomic JSON file store) — easy to back up,
  inspect, or wipe. Images are stored as data-URLs (auto-downscaled to ≤1600px).
- All clustering/statistics are implemented in `lib/analysis.ts`
  (similarity matrix, agglomerative average-linkage dendrogram, tree-test
  path metrics, etc.).
