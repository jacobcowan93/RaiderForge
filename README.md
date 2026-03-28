# Raider Forge

RaiderForge is a fan-made **ARC Raiders** tactical hub (not affiliated with Embark Studios). It ships as a production Next.js app with real integrations where configured.

## Stack

| Layer | Technology |
|--------|------------|
| Framework | **Next.js** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS** + project design tokens (`rf-*` in `src/styles/globals.css`) |
| Maps | **Leaflet** + **react-leaflet**; tactical tiles from [ardb.app](https://ardb.app) |
| Auth & data | **NextAuth.js** + **Prisma** (optional SQLite/Postgres for sessions and profile sync) |
| UI | Custom components (no shadcn/ui in the default tree) |

## Data sources (live vs fallback)

- **MetaForge** — map rotation / event schedule (`/api/events` proxy). Used by the home **Live** panel and map condition UI. Falls back to a static rotation table when the API is unavailable.
- **ardb.app** — quest data and map tile templates (see map pages and footer attribution).
- **Game map metadata** — `GET /api/game/maps` (Mahcks/community pipeline) for thumbnails where applicable.
- **G2G** — optional marketplace OpenAPI when `G2G_*` env vars are set.

## Product maturity labels

Hub pages use **Live**, **Beta**, or **In development** badges (`PageMaturityBadge`) so visitors know what is production-ready vs evolving.

Quick start

1. Install dependencies:

```bash
npm install
# or
# yarn
```

2. Place assets

Move your existing `assets/` folder into `public/images` so the app can serve images and video.

```bash
mv assets public/images
# or create a symlink if preferred
```

3. Run dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

Environment variables

See `.env.example` for variables the clients will use once wired to real APIs. Important server-side variables include:

- `G2G_API_KEY` — your G2G API key (server-side only)
- `G2G_SECRET` — your G2G signing secret (server-side only)
- `G2G_USERNAME` — username or account id used when signing requests

These are server-side secrets and must never be committed or logged. They are accessed in code via `process.env.*` and consumed only on the server.

OAuth Setup (Google and Discord)

This app uses NextAuth for authentication with Google and Discord providers. All OAuth secrets are stored in environment variables and must never be committed.

Required environment variables:
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `DISCORD_CLIENT_ID` — from Discord Developer Portal
- `DISCORD_CLIENT_SECRET` — from Discord Developer Portal
- `NEXTAUTH_URL` — your app's URL (e.g., `http://localhost:3000` for dev, `https://raiderforge.org` for prod)
- `NEXTAUTH_SECRET` — a random string for JWT signing

Redirect URIs to configure in providers:
- Google: `https://raiderforge.org/api/auth/callback/google` (and localhost version for dev)
- Discord: `https://raiderforge.org/api/auth/callback/discord` (and localhost version for dev)

Deployment on Vercel

This app is designed to be hosted on Vercel with default settings.

1. Push your code to a GitHub repository.
2. Go to Vercel → New Project → Import the RaiderForge repo.
3. Vercel will auto-detect Next.js and use default build settings (`next build`, output `.next`).
4. In Project Settings → Environment Variables, add all variables from `.env.example` with your production values.
   - Set `NEXTAUTH_URL` to `https://raiderforge.org`.
5. Deploy. After successful deploy, add `raiderforge.org` as a custom domain in Vercel's Domains settings and update your DNS.

No additional config files needed; Vercel's defaults work with this setup.

Static media

Place static media in `public/images` and reference it in the app via `/images/<filename>` (for example, `/images/ARC_Home.mp4`).

## Optional: development banner

- `NEXT_PUBLIC_SHOW_DEV_BANNER` — `0` / `false` hides the sticky status strip everywhere; `1` / `true` forces it on. If unset, the banner appears only when `NODE_ENV=development`.

## Notes

- Place hero video at `public/images/ARC_Home.mp4` and header art under `public/images/header/` as in the repo.
- The **Builds** hub is a stub until a MetaForge (or other) embed URL is wired in.
