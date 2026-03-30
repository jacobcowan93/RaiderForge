'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export type SharedBuild = {
    id: string
    userId: string
    userName: string | null
    buildName: string
    buildCode: string
    totalPts: number
    createdAt: string
}

// Parse per-branch points directly from the compact build code.
// Format: "C1:3,C2l:1|M1:5,M2l:2|S1:1"  (| separates branches, , separates nodes)
function parseBranchPts(code: string): { C: number; M: number; S: number } {
    const pts = { C: 0, M: 0, S: 0 }
    for (const entry of code.split(/[|,]/)) {
        const m = entry.match(/^([CMS])[^:]*:(\d+)$/)
        if (m) pts[m[1] as 'C' | 'M' | 'S'] += parseInt(m[2], 10)
    }
    return pts
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString()
}

const BRANCH_LABELS = { C: 'Conditioning', M: 'Mobility', S: 'Survival' }
const BRANCH_COLORS = { C: '#22c55e', M: '#eab308', S: '#ef4444' }

function BuildCard({
    build,
    currentUserId,
    onDelete,
}: {
    build: SharedBuild
    currentUserId: string | undefined
    onDelete: (id: string) => void
}) {
    const [deleting, setDeleting] = useState(false)
    const branch = parseBranchPts(build.buildCode)
    const isOwner = currentUserId === build.userId

    async function handleDelete() {
        if (!confirm('Remove this shared build?')) return
        setDeleting(true)
        const res = await fetch(`/api/skill-tree/shared/${build.id}`, { method: 'DELETE' })
        if (res.ok) onDelete(build.id)
        else setDeleting(false)
    }

    return (
        <div className="group flex flex-col rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.16] hover:shadow-[0_0_28px_-6px_rgba(255,255,255,0.08)]"
             style={{ background: 'rgba(10,14,22,0.85)' }}>
            {/* top accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-rf-red/70 via-rf-red/25 to-transparent" />

            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Name + time */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-white/90">
                        {build.buildName}
                    </h3>
                    <span className="text-[10px] text-white/25 shrink-0 mt-0.5">{timeAgo(build.createdAt)}</span>
                </div>

                {/* Author */}
                <p className="text-[11px] text-white/40">
                    by <span className="text-white/60 font-medium">{build.userName ?? 'Anonymous'}</span>
                </p>

                {/* Branch pts */}
                <div className="flex gap-2 flex-wrap">
                    {(['C', 'M', 'S'] as const).map((b) => (
                        <div key={b} className="flex items-center gap-1 rounded-md px-2 py-1 border"
                             style={{
                                 background: `${BRANCH_COLORS[b]}12`,
                                 borderColor: `${BRANCH_COLORS[b]}30`,
                             }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRANCH_COLORS[b] }} />
                            <span className="text-[10px] font-semibold tabular-nums" style={{ color: BRANCH_COLORS[b] }}>
                                {branch[b]}
                            </span>
                            <span className="text-[9px] text-white/30">{BRANCH_LABELS[b].slice(0, 4)}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1 rounded-md px-2 py-1 border border-white/[0.08] bg-white/[0.03]">
                        <span className="text-[10px] font-bold text-white/60 tabular-nums">{build.totalPts}</span>
                        <span className="text-[9px] text-white/25">pts</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 border-t border-white/[0.05] flex gap-2">
                    <Link
                        href={`/skill-trees?b=${encodeURIComponent(build.buildCode)}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold
                                   bg-rf-red/10 border border-rf-red/30 text-rf-red
                                   hover:bg-rf-red/20 hover:border-rf-red/50 transition-colors"
                    >
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Open in Planner
                    </Link>
                    {isOwner && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center justify-center rounded-lg px-2.5 py-2 text-xs
                                       border border-white/[0.08] text-white/30 bg-white/[0.02]
                                       hover:border-red-500/30 hover:text-red-400 transition-colors
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete this build"
                        >
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export function SharedBuildsGallery({ newBuild }: { newBuild?: SharedBuild | null }) {
    const { data: session } = useSession()
    const currentUserId = (session?.user as { id?: string } | undefined)?.id

    const [builds, setBuilds] = useState<SharedBuild[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/skill-tree/shared')
                if (!res.ok) throw new Error(`Failed to load (${res.status})`)
                const data = await res.json() as { builds: SharedBuild[] }
                if (!cancelled) setBuilds(data.builds ?? [])
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load builds')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [])

    // Prepend a newly shared build without refetching
    useEffect(() => {
        if (!newBuild) return
        setBuilds((prev) => [newBuild, ...prev.filter((b) => b.id !== newBuild.id)])
    }, [newBuild])

    function handleDelete(id: string) {
        setBuilds((prev) => prev.filter((b) => b.id !== id))
    }

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-rf-red/80 font-bold mb-1">Community</p>
                    <h2 className="text-xl font-bold text-white">Shared Builds</h2>
                </div>
                {builds.length > 0 && (
                    <span className="text-[11px] text-white/30 tabular-nums">{builds.length} build{builds.length !== 1 ? 's' : ''}</span>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] p-4 animate-pulse space-y-3"
                             style={{ background: 'rgba(10,14,22,0.85)' }}>
                            <div className="h-4 bg-white/[0.07] rounded w-3/4" />
                            <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                            <div className="flex gap-2">
                                <div className="h-6 bg-white/[0.05] rounded w-16" />
                                <div className="h-6 bg-white/[0.05] rounded w-16" />
                                <div className="h-6 bg-white/[0.05] rounded w-16" />
                            </div>
                            <div className="h-8 bg-white/[0.06] rounded" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-500/20 px-5 py-6 text-center" style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <p className="text-sm text-red-400/80">{error}</p>
                </div>
            ) : builds.length === 0 ? (
                <div className="rounded-xl border border-white/[0.07] px-6 py-10 text-center" style={{ background: 'rgba(10,14,22,0.6)' }}>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] mb-4"
                         style={{ background: 'rgba(255,64,64,0.08)' }}>
                        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,64,64,0.6)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-white/50 mb-1">No shared builds yet</p>
                    <p className="text-xs text-white/28 max-w-xs mx-auto leading-relaxed">
                        Be the first! Build your skill tree below and hit <strong className="text-white/40">Share to Community</strong> to post it here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {builds.map((b) => (
                        <BuildCard
                            key={b.id}
                            build={b}
                            currentUserId={currentUserId}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
