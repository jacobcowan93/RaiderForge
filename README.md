# Raider Forge

Raider Forge is an ARC Raiders companion hub scaffolded with Next.js, TypeScript, and Tailwind CSS.

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

Notes & TODOs

- All external integrations (MetaForge, ARDB, G2G) are mocked. See `src/api/*` for TODOs and interfaces.
- Place your logo at `public/images/logo.png` and hero video at `public/images/ARC_Home.mp4`.
- The Builds page is prepared to embed MetaForge's skill tree editor via iframe (TODO: embed URL and params).
