'use client'

import { Suspense, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PlannerSkeleton } from '@/components/ui/Skeleton'
import { SkillTreeErrorBoundary } from '@/components/skills/SkillTreeErrorBoundary'
import { SkillTreePlanner } from '@/components/skills/SkillTreePlanner'
import type { SharedBuild } from '@/components/skills/SharedBuildsGallery'
import {
    type BuildAllocations,
    buildSkillTreeShareUrl,
    encodeBuildToUrl,
} from '@/lib/skills/planner'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

// ── Inline share row (copy link + share to community side-by-side) ─────────────

function BuildShareRow({
    allocs,
    spentTotal,
    onShared,
    onReset,
}: {
    allocs:     BuildAllocations
    spentTotal: number
    onShared:   (build: SharedBuild) => void
    onReset:    () => void
}) {
    const [copied,       setCopied]      = useState(false)
    const [galleryOpen,  setGalleryOpen] = useState(false)
    const [name,         setName]        = useState('')
    const [posting,      setPosting]     = useState(false)
    const [postError,    setPostError]   = useState<string | null>(null)
    const [postSuccess,  setPostSuccess] = useState(false)

    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id
    const empty  = spentTotal === 0

    async function handleCopyLink() {
        if (empty) return
        const url = buildSkillTreeShareUrl(allocs, getSiteOrigin())
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { /* ignore */ }
    }

    async function handlePost() {
        if (!name.trim() || empty) return
        setPosting(true)
        setPostError(null)
        const buildCode = encodeBuildToUrl(allocs)
        try {
            const res  = await fetch('/api/skill-tree/shared', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ buildName: name.trim(), buildCode, totalPts: spentTotal }),
            })
            const json = await res.json() as { ok?: boolean; build?: SharedBuild; message?: string; error?: string }
            if (!res.ok) {
                setPostError(json.message ?? json.error ?? 'Failed to share.')
            } else {
                setPostSuccess(true)
                setName('')
                if (json.build) onShared(json.build)
                setTimeout(() => { setPostSuccess(false); setGalleryOpen(false) }, 2000)
            }
        } catch {
            setPostError('Network error. Try again.')
        } finally {
            setPosting(false)
        }
    }

    const compactBtn =
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ' +
        'border transition-all duration-150 active:scale-[0.97] ' +
        'bg-white/[0.04] border-white/12 text-white/50 ' +
        'hover:bg-white/[0.08] hover:border-white/20 hover:text-white/75 ' +
        'disabled:opacity-35 disabled:cursor-not-allowed'

    return (
        <>
            {/* ── Divider row: Your Build label + two compact action buttons ── */}
            <div className="flex items-center justify-between gap-4 mt-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-white/[0.12]" />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold shrink-0">
                        Your Build
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Copy share link — small */}
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        disabled={empty}
                        title={empty ? 'Allocate some points first' : 'Copy shareable link'}
                        className={compactBtn}
                    >
                        {copied ? (
                            <>
                                <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                                     stroke="#4ade80" strokeWidth={2.5}
                                     strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span className="text-green-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth={2}
                                     strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                Copy link
                            </>
                        )}
                    </button>

                    {/* Share to community — small toggle */}
                    <button
                        type="button"
                        onClick={() => { setGalleryOpen((v) => !v); setPostError(null) }}
                        disabled={empty}
                        title={empty ? 'Allocate some points first' : 'Share to community gallery'}
                        className={compactBtn}
                        style={galleryOpen ? {
                            background:   'rgba(255,255,255,0.07)',
                            borderColor:  'rgba(255,255,255,0.20)',
                            color:        'rgba(255,255,255,0.80)',
                        } : {}}
                    >
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth={2}
                             strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Share to community
                    </button>

                    {/* Reset — small, destructive-tinted */}
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={empty}
                        title="Reset all points"
                        className={compactBtn}
                        style={empty ? {} : {
                            color:       'rgba(255,100,100,0.6)',
                            borderColor: 'rgba(255,100,100,0.15)',
                        }}
                    >
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth={2.5}
                             strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 1 0 .49-3.58"/>
                        </svg>
                        Reset
                    </button>
                </div>
            </div>

            {/* ── Expandable share-to-community form ─────────────────────────── */}
            {galleryOpen && (
                <div
                    className="mb-4 rounded-xl border border-white/[0.08] px-4 py-3 flex flex-col gap-2.5"
                    style={{ background: 'rgba(15,20,27,0.70)' }}
                >
                    {sessionStatus === 'loading' ? (
                        <p className="text-[10px] text-white/30">Checking sign-in…</p>

                    ) : !userId ? (
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-[11px] text-white/45 leading-relaxed">
                                Sign in to share your build with the community.
                            </p>
                            <a
                                href="/auth/signin"
                                className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold
                                           rounded-lg px-3 py-1.5 bg-green-700/20 border border-green-600/40
                                           text-green-500 hover:bg-green-700/30 transition-colors"
                            >
                                Sign in
                            </a>
                        </div>

                    ) : postSuccess ? (
                        <div className="flex items-center gap-2">
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                                 stroke="#4ade80" strokeWidth={2.5}
                                 strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <p className="text-[11px] text-emerald-400/90 font-semibold">
                                Build shared to community!
                            </p>
                        </div>

                    ) : (
                        <>
                            <p className="text-[10px] text-white/35 leading-relaxed">
                                Give your build a name — it will appear in the community gallery.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setPostError(null) }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handlePost() }}
                                    placeholder="e.g. Full Conditioning Tank"
                                    maxLength={60}
                                    className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px]
                                               text-white/70 placeholder-white/18 border border-white/[0.08]
                                               focus:outline-none focus:border-white/20 transition-colors"
                                    style={{ background: 'rgba(7,9,13,0.85)' }}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handlePost}
                                    disabled={!name.trim() || posting}
                                    className="shrink-0 text-[11px] font-semibold rounded-lg px-3 py-1.5
                                               border border-green-600/40 bg-green-700/20 text-green-500
                                               hover:bg-green-700/30 hover:border-green-500/60 transition-colors
                                               disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {posting ? 'Posting…' : 'Post build'}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-white/20 tabular-nums">{name.length}/60</span>
                                {postError && (
                                    <p className="text-[10px] text-red-400/85 leading-snug">{postError}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    )
}

// ── Main client section ────────────────────────────────────────────────────────

export function SkillTreesClientSection() {
    const [newBuild,   setNewBuild]   = useState<SharedBuild | null>(null)
    const [allocs,     setAllocs]     = useState<BuildAllocations>({})
    const [spentTotal, setSpentTotal] = useState(0)
    const [resetKey,   setResetKey]   = useState(0)

    const handleAllocsChange = useCallback((a: BuildAllocations, pts: number) => {
        setAllocs(a)
        setSpentTotal(pts)
    }, [])

    const handleReset = useCallback(() => {
        setResetKey((k) => k + 1)
    }, [])

    return (
        <>
            {/* ── Share row: copy link + share to community + reset ─────────── */}
            <BuildShareRow
                allocs={allocs}
                spentTotal={spentTotal}
                onShared={setNewBuild}
                onReset={handleReset}
            />

            {/* ── Planner ─────────────────────────────────────────────────── */}
            <SkillTreeErrorBoundary>
                <Suspense fallback={<PlannerSkeleton />}>
                    <SkillTreePlanner onAllocsChange={handleAllocsChange} resetKey={resetKey} />
                </Suspense>
            </SkillTreeErrorBoundary>
        </>
    )
}
