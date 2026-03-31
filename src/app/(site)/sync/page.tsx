'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncRecord = {
    source: string
    status: string
    importedAt: string
    blueprintsCount: number
    skillTreeImported: boolean
}

type ImportResult = {
    ok: true
    blueprintsImported: number
    skillTreeImported: boolean
    warnings: string[]
    status: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

function statusColor(s: string) {
    if (s === 'success') return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/[0.06]'
    if (s === 'partial') return 'text-yellow-300 border-yellow-500/25 bg-yellow-500/[0.06]'
    return 'text-red-400 border-red-500/25 bg-red-500/[0.06]'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm p-6 space-y-5 ${className}`}>
            {children}
        </div>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">{children}</p>
    )
}

function WhatGetsImported() {
    const items = [
        {
            icon: (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
            ),
            label: 'Blueprints',
            detail: 'Owned blueprint list → Blueprint Tracker',
            live: true,
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
            ),
            label: 'Skill Tree',
            detail: 'Point allocations → Skill Tree Planner',
            live: true,
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
            ),
            label: 'Loadouts',
            detail: 'Saved gear sets → Loadout Builder',
            live: false,
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
            ),
            label: 'Stash / Inventory',
            detail: 'Item stash snapshot',
            live: false,
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
            ),
            label: 'Quest Progress',
            detail: 'Completed quests + progress',
            live: false,
        },
    ]

    return (
        <div className="space-y-2">
            {items.map(({ icon, label, detail, live }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                    <div className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg border ${live ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400' : 'border-white/[0.08] bg-white/[0.03] text-white/25'}`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`font-semibold ${live ? 'text-white/90' : 'text-white/35'}`}>
                            {label}
                        </span>
                        <span className="text-white/35 text-xs ml-2">{detail}</span>
                    </div>
                    {live ? (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/25 bg-emerald-500/[0.06] px-2 py-0.5 rounded-full shrink-0">
                            Live
                        </span>
                    ) : (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 rounded-full shrink-0">
                            Coming soon
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SyncPage() {
    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id

    const [syncRecord, setSyncRecord] = useState<SyncRecord | null>(null)
    const [syncLoading, setSyncLoading] = useState(false)

    const [fileContent, setFileContent] = useState<string>('')
    const [fileName, setFileName] = useState<string>('')
    const [parseError, setParseError] = useState<string | null>(null)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [importError, setImportError] = useState<string | null>(null)

    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load existing sync record
    useEffect(() => {
        if (!userId) return
        let cancelled = false
        setSyncLoading(true)
        void (async () => {
            try {
                const res = await fetch('/api/user/sync', { credentials: 'same-origin' })
                if (!res.ok || cancelled) return
                const data = (await res.json()) as { sync: SyncRecord | null }
                if (!cancelled) setSyncRecord(data.sync)
            } catch { /* non-fatal */ } finally {
                if (!cancelled) setSyncLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [userId])

    // Handle file selection (input or drop)
    const handleFile = useCallback((file: File) => {
        setParseError(null)
        setImportResult(null)
        setImportError(null)
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            setFileContent(text)
            // Quick pre-validation for immediate feedback
            try {
                const parsed = JSON.parse(text)
                if (!parsed || typeof parsed !== 'object') {
                    setParseError('File does not contain a valid JSON object.')
                } else if (parsed.version !== 1) {
                    setParseError(`Unrecognised version "${parsed.version ?? 'missing'}". Expected 1.`)
                }
            } catch {
                setParseError('File is not valid JSON.')
            }
        }
        reader.readAsText(file)
    }, [])

    function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFile(file)
    }

    async function handleImport() {
        if (!fileContent || parseError) return
        setImporting(true)
        setImportError(null)
        setImportResult(null)
        try {
            const body = JSON.parse(fileContent)
            const res = await fetch('/api/user/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(body),
            })
            const json = await res.json() as ImportResult | { ok: false; error: string; message: string }
            if (!res.ok || !json.ok) {
                setImportError(('message' in json ? json.message : null) ?? 'Import failed.')
                return
            }
            setImportResult(json as ImportResult)
            // Refresh sync record
            const syncRes = await fetch('/api/user/sync', { credentials: 'same-origin' })
            if (syncRes.ok) {
                const data = (await syncRes.json()) as { sync: SyncRecord | null }
                setSyncRecord(data.sync)
            }
        } catch {
            setImportError('Could not reach the server. Check your connection and try again.')
        } finally {
            setImporting(false)
        }
    }

    // ── Not signed in ─────────────────────────────────────────────────────────
    if (sessionStatus === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-white/40 text-sm gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Loading…
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
                <div className="h-16 w-16 rounded-2xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/30" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                </div>
                <div>
                    <p className="text-lg font-bold text-white">Sign in to sync your profile</p>
                    <p className="text-sm text-white/50 mt-1 leading-relaxed">
                        A RaiderForge account lets you import and sync your ARC Raiders data across devices.
                    </p>
                </div>
                <a
                    href="/auth/signin?callbackUrl=/sync"
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-6 py-3 transition-colors shadow-lg shadow-yellow-900/25"
                >
                    Sign in to continue
                </a>
            </div>
        )
    }

    // ── Main UI ───────────────────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-5 py-8 md:py-12 space-y-6">

            {/* Page header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        Sync <span className="text-yellow-400">My Profile</span>
                    </h1>
                    <span className="text-[9px] font-bold uppercase tracking-widest border border-yellow-500/25 bg-yellow-500/[0.06] text-yellow-300/80 px-2 py-0.5 rounded-full">
                        Beta
                    </span>
                </div>
                <p className="text-sm text-white/55 leading-relaxed max-w-xl">
                    Import your ARC Raiders data to keep blueprints, skill trees, and loadouts in sync across devices.
                    Automatic sync will be available when Embark publishes their account API.
                </p>
            </div>

            {/* Last sync status */}
            {!syncLoading && syncRecord && (
                <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${statusColor(syncRecord.status)}`}>
                    <div className="h-2 w-2 rounded-full bg-current animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                            Last sync: {timeAgo(syncRecord.importedAt)}
                        </p>
                        <p className="text-[11px] opacity-75 mt-0.5">
                            {syncRecord.blueprintsCount > 0 && `${syncRecord.blueprintsCount} blueprints`}
                            {syncRecord.blueprintsCount > 0 && syncRecord.skillTreeImported && ' · '}
                            {syncRecord.skillTreeImported && 'Skill tree'}
                            {' · '}
                            Source: {syncRecord.source === 'raiderforge_export' ? 'RaiderForge export' : 'Manual import'}
                        </p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full shrink-0 ${statusColor(syncRecord.status)}`}>
                        {syncRecord.status}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── Left: import form ────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-5">

                    {/* Manual JSON import */}
                    <SectionCard>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <SectionLabel>Manual Import</SectionLabel>
                                <p className="text-base font-semibold text-white mt-1">Upload a profile export file</p>
                                <p className="text-xs text-white/45 mt-1 leading-relaxed">
                                    Export your profile from RaiderForge (or build a JSON file manually).
                                    See the format guide below.
                                </p>
                            </div>
                        </div>

                        {/* Drop zone */}
                        <div
                            role="button"
                            tabIndex={0}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
                            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
                                dragging
                                    ? 'border-yellow-400/60 bg-yellow-400/[0.04]'
                                    : fileName && !parseError
                                        ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                                        : parseError
                                            ? 'border-red-500/40 bg-red-500/[0.03]'
                                            : 'border-white/[0.12] hover:border-white/25 bg-white/[0.01]'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,application/json"
                                className="sr-only"
                                onChange={handleFileInputChange}
                            />

                            {fileName && !parseError ? (
                                <>
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    <p className="text-sm font-semibold text-emerald-400">{fileName}</p>
                                    <p className="text-xs text-white/40">Click to choose a different file</p>
                                </>
                            ) : parseError ? (
                                <>
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    <p className="text-sm font-semibold text-red-400">{parseError}</p>
                                    <p className="text-xs text-white/40">Click to try a different file</p>
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.3" className="text-white/25" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                    </svg>
                                    <p className="text-sm font-semibold text-white/60">
                                        {dragging ? 'Drop it here' : 'Drop JSON file or click to browse'}
                                    </p>
                                    <p className="text-xs text-white/30">.json files only</p>
                                </>
                            )}
                        </div>

                        {/* Import feedback */}
                        {importResult && (
                            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 space-y-1.5">
                                <p className="text-sm font-semibold text-emerald-400">Import successful</p>
                                <ul className="text-xs text-emerald-400/80 space-y-0.5">
                                    {importResult.blueprintsImported > 0 && (
                                        <li>{importResult.blueprintsImported} blueprints imported →{' '}
                                            <Link href="/blueprints" className="underline hover:text-emerald-300">Blueprint Tracker</Link>
                                        </li>
                                    )}
                                    {importResult.skillTreeImported && (
                                        <li>Skill tree imported →{' '}
                                            <Link href="/skill-trees" className="underline hover:text-emerald-300">Skill Tree Planner</Link>
                                        </li>
                                    )}
                                </ul>
                                {importResult.warnings.length > 0 && (
                                    <ul className="text-[11px] text-yellow-300/70 mt-1 space-y-0.5 border-t border-white/[0.06] pt-2">
                                        {importResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}

                        {importError && (
                            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3">
                                <p className="text-sm text-red-400">{importError}</p>
                            </div>
                        )}

                        {/* Import button */}
                        <button
                            type="button"
                            disabled={!fileContent || !!parseError || importing}
                            onClick={handleImport}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-yellow-500 hover:bg-yellow-400 text-black shadow-md shadow-yellow-900/20 disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                        >
                            {importing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Importing…
                                </span>
                            ) : 'Import Profile Data'}
                        </button>
                    </SectionCard>

                    {/* JSON format reference */}
                    <SectionCard>
                        <SectionLabel>Import Format Reference</SectionLabel>
                        <p className="text-xs text-white/45 leading-relaxed">
                            Create a <code className="text-yellow-300/70 bg-white/[0.06] px-1.5 py-0.5 rounded text-[11px]">.json</code> file with this structure.
                            All sections are optional — only include what you want to import.
                        </p>
                        <pre className="overflow-x-auto rounded-xl border border-white/[0.08] bg-black/50 px-4 py-4 text-[11px] leading-relaxed text-white/60 font-mono">
{`{
  "version": 1,
  "source": "manual",
  "blueprints": {
    "owned": [
      "ardb-item-id-1",
      "ardb-item-id-2"
    ]
  },
  "skillTree": {
    "version": 1,
    "allocations": {
      "conditioning_endurance": 2,
      "mobility_sprint":        1
    }
  }
}`}
                        </pre>
                        <p className="text-[11px] text-white/35 leading-relaxed">
                            Blueprint IDs must match ARDB item IDs from{' '}
                            <a href="https://ardb.app" target="_blank" rel="noopener noreferrer" className="text-yellow-300/60 hover:text-yellow-300 underline">
                                ardb.app
                            </a>.
                            Skill tree node IDs match the node IDs shown in the URL of a shared build.
                        </p>
                    </SectionCard>
                </div>

                {/* ── Right: status + coming soon ──────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* What gets imported */}
                    <SectionCard>
                        <SectionLabel>What gets imported</SectionLabel>
                        <WhatGetsImported />
                    </SectionCard>

                    {/* Embark OAuth teaser */}
                    <SectionCard>
                        <SectionLabel>Automatic Sync</SectionLabel>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400/70 shrink-0" aria-hidden>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <p className="text-sm font-semibold text-white/80">Connect Embark Account</p>
                            </div>
                            <p className="text-xs text-white/45 leading-relaxed">
                                One-click account link that automatically pulls your stash, blueprints,
                                quests, and loadouts. Available when Embark Studios publishes their
                                account API.
                            </p>
                            <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/25 text-xs font-bold cursor-not-allowed"
                            >
                                Connect Embark Account — Coming Soon
                            </button>
                            <p className="text-[10px] text-white/25 leading-relaxed">
                                No Embark API exists yet. We&apos;ll enable this the day it&apos;s available.
                            </p>
                        </div>
                    </SectionCard>

                    {/* Quick links */}
                    <SectionCard>
                        <SectionLabel>After importing, go to</SectionLabel>
                        <div className="space-y-2">
                            {[
                                { href: '/blueprints', label: 'Blueprint Tracker', detail: 'See your owned + missing blueprints' },
                                { href: '/skill-trees', label: 'Skill Tree Planner', detail: 'View or adjust your build' },
                                { href: '/loadouts', label: 'Loadout Builder', detail: 'Plan your raid gear' },
                            ].map(({ href, label, detail }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 hover:border-white/15 hover:bg-white/[0.04] transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{label}</p>
                                        <p className="text-[11px] text-white/35">{detail}</p>
                                    </div>
                                    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" className="text-white/20 group-hover:text-white/50 shrink-0 transition-colors" aria-hidden>
                                        <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    )
}
