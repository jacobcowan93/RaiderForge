import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const toolLinks = [
    { label: 'Skill Tree Planner', href: '/skill-trees' },
    { label: 'Builds',             href: '/builds'      },
    { label: 'Blueprint Tracker',  href: '/blueprints'  },
    { label: 'Strategy Guides',    href: '/guides'      },
    { label: 'Loadouts',           href: '/loadouts'    },
    { label: 'Raider Profile',     href: '/profile'     },
    { label: 'Marketplace',        href: '/marketplace' },
    { label: 'Weekly Trials',      href: '/trials'      },
    { label: 'Quests',             href: '/quests'      },
    { label: 'Traders',            href: '/traders'     },
]

/* ── Icon SVGs ─────────────────────────────────────────────────────────────── */
function DiscordIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.133 18.114a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
    )
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    )
}

export default function Footer() {
    return (
        <footer className="border-t border-rf-border bg-rf-bg" aria-label="Site footer">
            <div className="mx-auto max-w-7xl px-6 py-10">

                {/* ── Brand + socials ────────────────────────────────────────── */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 rounded-md overflow-hidden ring-1 ring-white/10 shrink-0">
                            <Image
                                src="/images/logo/ARC_Header.jpeg"
                                alt="RaiderForge logo"
                                fill
                                className="object-cover"
                                sizes="32px"
                            />
                        </div>
                        <span className="text-sm font-black tracking-[0.2em] uppercase">
                            <span className="text-white">Raider</span><span className="text-rf-red">Forge</span>
                        </span>
                    </div>

                    <p className="text-xs text-rf-textSoft leading-relaxed max-w-sm">
                        The community toolkit for ARC Raiders — skill trees, blueprints, guides, and marketplace.
                        Free. Fan-made. Independent.
                    </p>

                    {/* Social links */}
                    <div className="flex items-center gap-2">
                        {/* Discord — highlighted as primary CTA */}
                        <a
                            href="https://discord.gg/raiderforge"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Join the RaiderForge Discord server"
                            className="rf-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-300 hover:border-indigo-400/55 hover:bg-indigo-500/18 hover:text-indigo-200 transition-all"
                        >
                            <DiscordIcon className="w-3.5 h-3.5" />
                            Join Discord
                        </a>

                        <a
                            href="https://twitter.com/raiderforge"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="RaiderForge on X (Twitter)"
                            className="rf-focus-ring inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rf-textSoft hover:border-white/20 hover:text-rf-text transition-all"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                        </a>

                        <a
                            href="https://www.reddit.com/r/ARCraiders/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="r/ARCraiders subreddit"
                            className="rf-focus-ring inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-rf-textSoft hover:border-white/20 hover:text-rf-text transition-all"
                        >
                            r/ARCraiders
                        </a>

                        <a
                            href="https://github.com/raiderforge"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="RaiderForge on GitHub"
                            className="rf-focus-ring inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] p-2 text-rf-textSoft hover:border-white/20 hover:text-rf-text transition-all"
                        >
                            <GitHubIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* ── Tool links ─────────────────────────────────────────────── */}
                <nav aria-label="Footer navigation" className="mt-8 pt-6 border-t border-rf-border/40">
                    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5">
                        {toolLinks.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="rf-focus-ring text-xs text-rf-textSoft hover:text-rf-cyan transition-colors"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* ── Data attribution ───────────────────────────────────────── */}
                <div className="mt-8 pt-5 border-t border-rf-border/40 text-center space-y-1.5">
                    <p className="text-[11px] text-white/35 leading-relaxed">
                        Some ARC Raiders data provided by{' '}
                        <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener noreferrer"
                            className="rf-focus-ring underline underline-offset-2 hover:text-white/60 transition-colors">
                            MetaForge
                        </a>
                        {' '}and{' '}
                        <a href="https://ardb.app" target="_blank" rel="noopener noreferrer"
                            className="rf-focus-ring underline underline-offset-2 hover:text-white/60 transition-colors">
                            ardb.app
                        </a>.
                    </p>
                    <p className="text-[11px] text-white/35 leading-relaxed">
                        Marketplace framework inspired by{' '}
                        <a href="https://docs.g2g.com/" target="_blank" rel="noopener noreferrer"
                            className="rf-focus-ring underline underline-offset-2 hover:text-white/60 transition-colors">
                            G2G
                        </a>.
                        {' '}RaiderForge is not affiliated with Embark Studios.
                        ARC Raiders™ is a trademark of Embark Studios AB.
                    </p>
                </div>

                {/* ── Legal bottom row ───────────────────────────────────────── */}
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <div className="text-rf-textSoft/60">© {new Date().getFullYear()} RaiderForge. All rights reserved.</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/35">
                        <Link href="/privacy" className="rf-focus-ring hover:text-rf-text transition-colors">Privacy Policy</Link>
                        <Link href="/terms"   className="rf-focus-ring hover:text-rf-text transition-colors">Terms of Use</Link>
                        <a href="https://raiderforge.org" className="rf-focus-ring hover:text-rf-text transition-colors">raiderforge.org</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
