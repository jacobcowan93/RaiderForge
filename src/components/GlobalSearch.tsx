'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Search index ─────────────────────────────────────────────────────────── */
type SearchEntry = { label: string; desc: string; href: string; keywords: string[] }

const SEARCH_INDEX: SearchEntry[] = [
    { label: 'Blueprint Tracker',  desc: 'Track owned & missing blueprints',              href: '/blueprints',  keywords: ['blueprint', 'missing', 'owned', 'track', 'export', 'pdf', 'item', 'list'] },
    { label: 'Skill Tree Planner', desc: 'Build and share your skill setup',              href: '/skill-trees', keywords: ['skill', 'tree', 'planner', 'build', 'conditioning', 'mobility', 'survival', 'points', 'exp'] },
    { label: 'Marketplace',        desc: 'Buy, sell, and AI-optimize listings',           href: '/marketplace', keywords: ['market', 'buy', 'sell', 'listing', 'trade', 'item', 'price', 'ai', 'optimizer'] },
    { label: 'Loadout Builder',    desc: 'Plan your gear setup, saved in-browser',        href: '/loadouts',    keywords: ['loadout', 'gear', 'weapon', 'armor', 'armour', 'equipment', 'slot', 'build'] },
    { label: 'Weekly Trials',      desc: "This week's rotations, tips & reset countdown", href: '/trials',      keywords: ['trial', 'weekly', 'rotation', 'reset', 'score', 'tips', 'monday'] },
    { label: 'Strategy Guides',    desc: 'Tips, tutorials, and tactical briefings',       href: '/guides',      keywords: ['guide', 'tip', 'tutorial', 'beginner', 'strategy', 'briefing', 'learn', 'how'] },
    { label: 'Quest Browser',      desc: 'All quests filterable by trader',               href: '/quests',      keywords: ['quest', 'mission', 'objective', 'reward', 'celeste', 'apollo', 'lance', 'shani', 'tian wen', 'task'] },
    { label: 'Traders',            desc: 'Vendor inventories for all five traders',       href: '/traders',     keywords: ['trader', 'vendor', 'shop', 'inventory', 'buy from', 'npc', 'stock'] },
    { label: 'Profile',            desc: 'Your raider profile and progress',              href: '/profile',     keywords: ['profile', 'account', 'progress', 'stats', 'me'] },
    { label: 'Profile Sync',       desc: 'Import your in-game profile data',              href: '/sync',        keywords: ['sync', 'import', 'profile', 'json', 'data', 'transfer'] },
    { label: 'Privacy Policy',     desc: 'How we handle your data',                       href: '/privacy',     keywords: ['privacy', 'data', 'gdpr', 'legal', 'cookies'] },
    { label: 'Terms of Use',       desc: 'Community rules and disclaimers',               href: '/terms',       keywords: ['terms', 'rules', 'legal', 'disclaimer', 'tos'] },
]

function scoreEntry(entry: SearchEntry, q: string): number {
    const lower = q.toLowerCase().trim()
    if (!lower) return 0
    const labelScore = entry.label.toLowerCase().includes(lower) ? 3 : 0
    const kwScore = entry.keywords.some(k => k.includes(lower)) ? 2 : 0
    const descScore = entry.desc.toLowerCase().includes(lower) ? 1 : 0
    return labelScore + kwScore + descScore
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export function GlobalSearch() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIdx, setActiveIdx] = useState(-1)

    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const listboxId = useId()
    const getOptionId = (i: number) => `${listboxId}-opt-${i}`

    const results: SearchEntry[] = query.trim()
        ? SEARCH_INDEX
            .map(e => ({ entry: e, score: scoreEntry(e, query) }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 7)
            .map(({ entry }) => entry)
        : []

    const displayList: SearchEntry[] = query.trim() ? results : SEARCH_INDEX.slice(0, 8)

    /* Reset active index when results change */
    useEffect(() => { setActiveIdx(-1) }, [query])

    /* Global Cmd/Ctrl+K to open */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    /* Focus input on open, reset state on close */
    useEffect(() => {
        if (open) {
            setQuery('')
            setActiveIdx(-1)
            setTimeout(() => inputRef.current?.focus(), 40)
        }
    }, [open])

    /* Prevent background scroll while open */
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [open])

    const navigate = useCallback((href: string) => {
        setOpen(false)
        router.push(href)
    }, [router])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (displayList.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIdx(i => {
                const next = i < displayList.length - 1 ? i + 1 : 0
                // scroll into view
                setTimeout(() => {
                    listRef.current?.querySelector<HTMLElement>(`[data-idx="${next}"]`)?.scrollIntoView({ block: 'nearest' })
                }, 0)
                return next
            })
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIdx(i => {
                const prev = i > 0 ? i - 1 : displayList.length - 1
                setTimeout(() => {
                    listRef.current?.querySelector<HTMLElement>(`[data-idx="${prev}"]`)?.scrollIntoView({ block: 'nearest' })
                }, 0)
                return prev
            })
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && activeIdx < displayList.length) {
                navigate(displayList[activeIdx].href)
            } else if (results.length > 0) {
                navigate(results[0].href)
            }
        }
    }, [activeIdx, displayList, results, navigate])

    /* ── Trigger button ──────────────────────────────────────────────────────── */
    return (
        <>
            {/* Desktop pill trigger */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rf-focus-ring hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-rf-textSoft hover:border-rf-cyan/25 hover:bg-rf-cyan/[0.06] hover:text-rf-text transition-all"
                aria-label="Open global search (Ctrl+K)"
                aria-haspopup="dialog"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <span>Search</span>
                <kbd className="rounded border border-white/10 bg-black/30 px-1 py-0.5 font-mono text-[9px] text-white/28">⌘K</kbd>
            </button>

            {/* Mobile icon trigger */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rf-focus-ring flex sm:hidden items-center justify-center rounded-lg p-1.5 text-rf-textSoft hover:text-rf-text transition-colors"
                aria-label="Open search"
                aria-haspopup="dialog"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
            </button>

            {/* ── Search dialog ─────────────────────────────────────────────────── */}
            {open && (
                <div
                    className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-[10vh]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site search"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-lg rounded-2xl border border-rf-border bg-rf-bgPanel shadow-2xl shadow-black/70 overflow-hidden"
                        style={{ boxShadow: '0 0 0 1px rgba(34,211,238,0.12), 0 0 40px -8px rgba(34,211,238,0.15), 0 25px 50px -12px rgba(0,0,0,0.8)' }}
                    >
                        {/* Top neon stripe */}
                        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-rf-cyan/50 to-transparent" aria-hidden="true" />

                        {/* Input row */}
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-rf-border/60">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                className="h-4 w-4 shrink-0 text-rf-cyan/60" aria-hidden="true">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="search"
                                role="combobox"
                                aria-autocomplete="list"
                                aria-expanded={displayList.length > 0}
                                aria-controls={listboxId}
                                aria-activedescendant={activeIdx >= 0 ? getOptionId(activeIdx) : undefined}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search tools, zones, quests…"
                                className="flex-1 bg-transparent text-sm text-rf-text placeholder:text-rf-textSoft/55 outline-none"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="shrink-0 rounded p-0.5 text-white/30 hover:text-white/60 transition-colors"
                                    aria-label="Clear search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                    </svg>
                                </button>
                            )}
                            <kbd className="shrink-0 rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-white/25">Esc</kbd>
                        </div>

                        {/* Results / quick-pick */}
                        <div className="max-h-[340px] overflow-y-auto">
                            {query.trim() && results.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-rf-textSoft">
                                    No results for &ldquo;<span className="text-white">{query}</span>&rdquo;
                                </p>
                            ) : (
                                <>
                                    {!query.trim() && (
                                        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-rf-textSoft/50">
                                            Jump to
                                        </p>
                                    )}
                                    {query.trim() && results.length > 0 && (
                                        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-rf-textSoft/50">
                                            {results.length} result{results.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                    <ul
                                        ref={listRef}
                                        id={listboxId}
                                        role="listbox"
                                        aria-label="Search results"
                                        className="pb-1.5"
                                    >
                                        {displayList.map((entry, idx) => {
                                            const isActive = idx === activeIdx
                                            return (
                                                <li
                                                    key={entry.href}
                                                    id={getOptionId(idx)}
                                                    role="option"
                                                    aria-selected={isActive}
                                                    data-idx={idx}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(entry.href)}
                                                        onMouseEnter={() => setActiveIdx(idx)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                            isActive
                                                                ? 'bg-rf-cyan/[0.1] border-l-2 border-rf-cyan/60'
                                                                : 'border-l-2 border-transparent hover:bg-white/[0.05]'
                                                        }`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium truncate ${isActive ? 'text-rf-cyan' : 'text-white'}`}>
                                                                {entry.label}
                                                            </p>
                                                            <p className="text-[11px] text-rf-textSoft truncate">{entry.desc}</p>
                                                        </div>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                                                            className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? 'text-rf-cyan/60' : 'text-white/20'}`}
                                                            aria-hidden="true">
                                                            <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-rf-border/40 px-4 py-2">
                            <div className="flex items-center gap-3 text-[10px] text-white/20">
                                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                                <span><kbd className="font-mono">↵</kbd> open</span>
                                <span><kbd className="font-mono">Esc</kbd> close</span>
                            </div>
                            <span className="text-[10px] text-white/15">raiderforge.org</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
