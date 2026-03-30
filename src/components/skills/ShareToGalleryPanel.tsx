'use client'

import { memo, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { BuildAllocations } from '@/lib/skills/planner'
import { encodeBuildToUrl } from '@/lib/skills/planner'
import type { SharedBuild } from './SharedBuildsGallery'

interface Props {
    allocs: BuildAllocations
    spentTotal: number
    onShared: (build: SharedBuild) => void
}

function ShareToGalleryPanelInner({ allocs, spentTotal, onShared }: Props) {
    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id

    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [posting, setPosting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const hasPoints = spentTotal > 0

    async function handlePost() {
        if (!name.trim() || !hasPoints) return
        setPosting(true)
        setError(null)

        const buildCode = encodeBuildToUrl(allocs)

        try {
            const res = await fetch('/api/skill-tree/shared', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buildName: name.trim(), buildCode, totalPts: spentTotal }),
            })
            const json = await res.json() as { ok?: boolean; build?: SharedBuild; message?: string; error?: string }
            if (!res.ok) {
                setError(json.message ?? json.error ?? 'Failed to share build.')
            } else {
                setSuccess(true)
                setName('')
                if (json.build) onShared(json.build)
                setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
            }
        } catch {
            setError('Network error. Try again.')
        } finally {
            setPosting(false)
        }
    }

    return (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden"
             style={{ background: 'rgba(15,20,27,0.65)' }}>
            {/* Toggle */}
            <button
                type="button"
                onClick={() => { setOpen((v) => !v); setError(null) }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                         stroke="rgba(255,255,255,0.35)" strokeWidth={2}
                         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span className="text-[11px] font-semibold text-white/40">Share to community</span>
                </div>
                <svg
                    className="transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
                    width={11} height={11} viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,0.25)" strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && (
                <div className="px-3 pb-3 flex flex-col gap-2.5">
                    {sessionStatus === 'loading' ? (
                        <p className="text-[10px] text-white/30">Checking sign-in…</p>
                    ) : !userId ? (
                        <div className="rounded-lg border border-white/[0.08] px-3 py-2.5 text-center"
                             style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <p className="text-[10px] text-white/40 mb-2 leading-relaxed">
                                Sign in to share your build with the community.
                            </p>
                            <a
                                href="/auth/signin"
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-3 py-1.5
                                           bg-rf-red/10 border border-rf-red/30 text-rf-red
                                           hover:bg-rf-red/20 transition-colors"
                            >
                                Sign in
                            </a>
                        </div>
                    ) : !hasPoints ? (
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            Allocate some points first, then share your build.
                        </p>
                    ) : success ? (
                        <div className="flex items-center gap-2 py-1">
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <p className="text-[11px] text-emerald-400/90 font-semibold">Build shared!</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] text-white/30 leading-relaxed">
                                Give your build a name and it will appear in the community gallery above.
                            </p>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(null) }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handlePost() }}
                                placeholder="e.g. Full Conditioning Tank"
                                maxLength={60}
                                className="w-full rounded-lg px-2.5 py-2 text-[11px]
                                           text-white/70 placeholder-white/18 border border-white/[0.08]
                                           focus:outline-none focus:border-white/20 transition-colors"
                                style={{ background: 'rgba(7,9,13,0.85)' }}
                                autoFocus
                            />
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] text-white/20 tabular-nums">{name.length}/60</span>
                                <button
                                    type="button"
                                    onClick={handlePost}
                                    disabled={!name.trim() || posting}
                                    className="text-[11px] font-semibold rounded-lg px-3 py-1.5
                                               border border-rf-red/30 bg-rf-red/10 text-rf-red
                                               hover:bg-rf-red/20 hover:border-rf-red/50 transition-colors
                                               disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {posting ? 'Posting…' : 'Post build'}
                                </button>
                            </div>
                            {error && (
                                <p className="text-[10px] text-red-400/85 leading-snug">{error}</p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export const ShareToGalleryPanel = memo(ShareToGalleryPanelInner)
ShareToGalleryPanel.displayName = 'ShareToGalleryPanel'
