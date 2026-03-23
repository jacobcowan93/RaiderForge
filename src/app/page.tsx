import Link from 'next/link'
import { Suspense } from 'react'
import LivePanel from '../components/LivePanel'
import { fetchMfEventsSchedule } from '../api/metaforgeService'
import { getActiveConditionsForMap } from '../lib/events/conditions'
import { MAPS } from '../data/maps'
// ── Event Status Line (Server Component) ─────────────────────────────────────
// Fetches live events from MetaForge and shows all active events across maps.
// Renders nothing if no events are active or if the fetch fails.

async function EventStatusLine() {
  let events: Awaited<ReturnType<typeof fetchMfEventsSchedule>> = []
  try {
    events = await fetchMfEventsSchedule()
  } catch {
    return null // Fail silently — hero still renders without it
  }

  const now = new Date()

  // Collect all active events across every map
  const activeRows: { event: string; mapName: string }[] = []
  for (const map of MAPS) {
    const cond = getActiveConditionsForMap(map.id, now, events)
    for (const event of cond.activeConditions) {
      activeRows.push({ event, mapName: map.displayName })
    }
  }

  if (activeRows.length === 0) return null

  return (
    <div className="mt-6 rounded-xl border border-[rgba(255,215,0,0.25)] bg-[rgba(255,215,0,0.08)] backdrop-blur-md px-4 py-3 text-left" style={{ boxShadow: '0 0 20px rgba(255,215,0,0.15)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-rf-red animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-rf-red">
          Current Events
        </span>
      </div>
      <div className="space-y-1">
        {activeRows.map(({ event, mapName }) => (
          <p key={`${event}-${mapName}`} className="text-xs text-white/60">
            <span className="text-white/85 font-medium">{event}</span>
            <span className="text-white/30 mx-1.5">—</span>
            {mapName}
          </p>
        ))}
      </div>
    </div>
  )
}

// ── Feature Grid ──────────────────────────────────────────────────────────────

type Accent = 'red' | 'orange' | 'yellow' | 'green'

const accentClasses: Record<Accent, { idle: string; hover: string; text: string }> = {
  red:    { idle: 'bg-rf-red/10 text-rf-red',       hover: 'group-hover:bg-rf-red group-hover:text-white',    text: 'text-rf-red'    },
  orange: { idle: 'bg-rf-orange/10 text-rf-orange',  hover: 'group-hover:bg-rf-orange group-hover:text-white', text: 'text-rf-orange' },
  yellow: { idle: 'bg-rf-yellow/10 text-rf-yellow',  hover: 'group-hover:bg-rf-yellow group-hover:text-black', text: 'text-rf-yellow' },
  green:  { idle: 'bg-rf-green/10 text-rf-green',    hover: 'group-hover:bg-rf-green group-hover:text-white',  text: 'text-rf-green'  },
}

const features: {
  label: string
  title: string
  desc: string
  href: string
  accent: Accent
  icon: React.ReactNode
}[] = [
  {
    label: 'INTERACTIVE MAPS',
    title: 'Master the Battlefield',
    desc: 'Navigate live maps with real-time event conditions, quest markers, and tactical overlays across every ARC Raiders zone.',
    href: '/maps',
    accent: 'green',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
  },
  {
    label: 'LOADOUT SYSTEM',
    title: 'Build. Optimize. Dominate.',
    desc: 'Craft powerful loadouts, analyze gear stats, and refine your strategy for every raid. From weapon tuning to full build planning, RaiderForge gives you the edge.',
    href: '/builds',
    accent: 'orange',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    label: 'BLUEPRINT TRACKING',
    title: 'Control Your Progression',
    desc: 'Track blueprint unlocks, manage crafting paths, and plan your upgrades with precision.',
    href: '/blueprints',
    accent: 'yellow',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    label: 'TRIAL SYSTEM',
    title: 'Maximize Every Run',
    desc: 'Follow optimized trial routes, complete objectives efficiently, and earn maximum rewards every cycle.',
    href: '/guides',
    accent: 'red',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    label: 'RAIDER PROFILE',
    title: 'Track Your Performance',
    desc: 'Sync your Raider identity, monitor progression, and prepare for full Embark account integration.',
    href: '/profile',
    accent: 'red',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    label: 'SECURE MARKETPLACE',
    title: 'Trade With Confidence',
    desc: 'Buy and sell safely with a secure escrow system designed for trusted peer-to-peer transactions.',
    href: '/marketplace',
    accent: 'orange',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* LivePanel — fixed right side on xl+ screens. Page content uses xl:pr-[300px] below. */}
      <LivePanel />

      {/* Main content — shifted left on xl+ to make room for LivePanel */}
      <div className="xl:pr-[300px]">

        {/* ── Hero ────────────────────────────────────────────────────────────
            -mt-16 pulls the section behind the fixed NavBar so the video
            fills the full viewport. pt-16 on the content div re-centers text. */}
        <section className="relative -mt-16 h-screen overflow-hidden">
          {/* Static header image — visible while video loads + fallback for unsupported browsers */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/header/ARC_Header.jpeg')" }}
          />
          {/* Video — plays over the image once loaded */}
          <video
            autoPlay muted loop playsInline
            poster="/images/header/ARC_Header.jpeg"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/images/ARC_Home.mp4" type="video/mp4" />
          </video>
          {/* Gradient: dark at top for nav clarity, mid-dark for text, rf-bg at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-rf-bg" />
          {/* Subtle red atmospheric glow at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-rf-red/8 to-transparent pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center pt-16">
            {/* Accent label */}
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-4">
              <span className="h-px w-6 bg-[#f97316]" />
              <span className="tracking-widest" style={{ color: '#22c55e' }}>Tactical Hub</span>
              <span className="h-px w-6 bg-[#f97316]" />
            </span>

            {/* Title */}
            <h1 className="text-shadow-hero text-5xl font-black tracking-tight sm:text-7xl leading-none">
              <span className="text-white">Raider</span><span className="text-rf-redSoft">Forge</span>
            </h1>

            {/* Tagline */}
            <p className="text-shadow-hero mt-6 max-w-xl text-sm sm:text-base text-white/75 leading-relaxed">
              Welcome to RaiderForge — your ultimate ARC Raiders command center.
              <br className="hidden sm:block" />
              Track blueprints in real time, sync your raider profile, explore interactive maps, dominate trials, and buy, sell, or trade with verified players in a secure, reputation-driven marketplace.
            </p>

            {/* Live event status — server-fetched from MetaForge, renders nothing if no events */}
            <Suspense fallback={null}>
              <EventStatusLine />
            </Suspense>
          </div>

          {/* Scroll indicator */}
          <a
            href="#features"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-xs text-rf-textSoft/35 hover:text-rf-textSoft transition-colors"
          >
            <span>Scroll</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 animate-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </a>
        </section>

        {/* ── Feature Grid ──────────────────────────────────────────────────── */}
        <section id="features" className="py-16 px-6 bg-rf-bgSoft">
          <div className="mx-auto max-w-7xl">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ label, title, desc, href, accent, icon }) => {
                const a = accentClasses[accent]
                return (
                  <Link
                    key={href}
                    href={href}
                    className="group rf-card rounded-xl p-6 hover:border-rf-red/40 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rf-red/10"
                  >
                    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${a.idle} ${a.hover}`}>
                      <div className="h-5 w-5">{icon}</div>
                    </div>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${a.text}`}>{label}</p>
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
                    <span className={`mt-4 inline-flex items-center gap-1 text-xs group-hover:gap-2 transition-all ${a.text}`}>
                      Deploy
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
