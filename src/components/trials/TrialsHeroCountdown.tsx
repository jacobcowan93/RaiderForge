'use client'

import { useEffect, useState } from 'react'

import type { TrialsCountdownVariant } from '@/lib/trials/trialsCountdownTarget'

function pad2(n: number) {
    return n.toString().padStart(2, '0')
}

function fmtCaptionUtc(iso: string): string {
    return (
        new Date(iso).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
        }) + ' UTC'
    )
}

type Props = {
    targetEpochMs: number
    countdownVariant: TrialsCountdownVariant
    /** When MetaForge-driven, ISO instant the timer counts down to */
    targetIsoUtc: string | null
    /** Weekly trials list came from MetaForge `weekly-trials` (5+5 rows). */
    trialsScheduleSynced: boolean
    /** Separate: live map events endpoint (modifiers, etc.). */
    eventsUpstreamOk: boolean
    /** Narrow utility block for header corner; full-width hero when false. */
    compact?: boolean
}

export function TrialsHeroCountdown({
    targetEpochMs,
    countdownVariant,
    targetIsoUtc,
    trialsScheduleSynced,
    eventsUpstreamOk,
    compact = false,
}: Props) {
    const [left, setLeft] = useState(() => Math.max(0, targetEpochMs - Date.now()))

    useEffect(() => {
        const t = window.setInterval(() => {
            setLeft(Math.max(0, targetEpochMs - Date.now()))
        }, 1000)
        return () => window.clearInterval(t)
    }, [targetEpochMs])

    const totalSec = Math.floor(left / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60

    const cells = [
        { label: 'Days', value: pad2(Math.min(days, 99)) },
        { label: 'Hrs', value: pad2(hours) },
        { label: 'Min', value: pad2(minutes) },
        { label: 'Sec', value: pad2(seconds) },
    ]

    const headline =
        countdownVariant === 'metaforge-next-start'
            ? 'Next rotation in'
            : countdownVariant === 'metaforge-active-end'
              ? 'Resets in'
              : 'Resets in'

    const subcopy =
        countdownVariant === 'metaforge-active-end' && targetIsoUtc
            ? `Current rotation ends ${fmtCaptionUtc(targetIsoUtc)} · MetaForge weekly-trials`
            : countdownVariant === 'metaforge-next-start' && targetIsoUtc
              ? `Next rotation starts ${fmtCaptionUtc(targetIsoUtc)} · MetaForge weekly-trials`
              : 'Next UTC Monday 00:00 · estimate when MetaForge schedule is unavailable'

    if (compact) {
        return (
            <div className="w-full max-w-[15.5rem] shrink-0 rounded-lg border border-white/25 bg-[#03050c]/90 p-3 shadow-[0_0_0_1px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] sm:max-w-[20rem] lg:max-w-[22rem] lg:ml-auto">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rf-red sm:text-[11px]">{headline}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-white/50 sm:line-clamp-none sm:text-[10px]">{subcopy}</p>

                <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
                    {cells.map((c) => (
                        <div
                            key={c.label}
                            className="relative overflow-hidden rounded-md border border-white/18 bg-[#050810] px-0.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-1 sm:py-2.5"
                        >
                            <div
                                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rf-red/40 to-transparent"
                                aria-hidden
                            />
                            <div className="font-mono text-xl font-black tabular-nums leading-none tracking-tight text-white sm:text-2xl">
                                {c.value}
                            </div>
                            <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em] text-sky-200/50 sm:text-[8px]">
                                {c.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-2 space-y-1 border-t border-white/15 pt-2 text-[8px] leading-snug text-white/38">
                    <p>
                        {trialsScheduleSynced ? (
                            <>
                                Timer uses{' '}
                                <span className="text-white/55 [word-break:break-word]">
                                    metaforge.app/api/arc-raiders/weekly-trials
                                </span>{' '}
                                window times.
                            </>
                        ) : (
                            <>
                                Weekly trial rows are a local fallback — timer uses{' '}
                                <span className="text-white/50">UTC Monday 00:00</span> until MetaForge returns a full
                                schedule.
                            </>
                        )}
                    </p>
                    <p
                        className={
                            eventsUpstreamOk ? 'font-semibold text-emerald-400/90' : 'font-semibold text-amber-200/75'
                        }
                    >
                        Map events API: {eventsUpstreamOk ? 'synced' : 'offline'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl">
            <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rf-red sm:text-xs">{headline}</p>
                    <p className="mt-1 text-[10px] text-white/40">{subcopy}</p>
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-200/35 sm:text-right">Clock</p>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                {cells.map((c) => (
                    <div
                        key={c.label}
                        className="relative overflow-hidden rounded-lg border border-blue-950/55 bg-[#03060d]/95 px-1 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-xl sm:px-2 sm:py-4 md:py-5"
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rf-red/40 to-transparent" aria-hidden />
                        <div className="font-mono text-3xl font-black tabular-nums leading-none tracking-tighter text-white sm:text-4xl md:text-5xl">
                            {c.value}
                        </div>
                        <div className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-sky-200/45 sm:mt-2 sm:text-[9px]">
                            {c.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/[0.06] pt-3 text-[9px] sm:text-[10px] text-white/38">
                <span className="text-center">
                    {trialsScheduleSynced ? (
                        <>
                            Timer uses{' '}
                            <span className="text-white/55">metaforge.app/api/arc-raiders/weekly-trials</span> window times.
                        </>
                    ) : (
                        <>
                            Weekly trial rows are a local fallback — timer uses{' '}
                            <span className="text-white/50">UTC Monday 00:00</span> until MetaForge returns a full schedule.
                        </>
                    )}
                </span>
                <span className="hidden sm:inline text-white/15">|</span>
                <span
                    className={
                        eventsUpstreamOk ? 'font-semibold text-emerald-400/90' : 'font-semibold text-amber-200/75'
                    }
                >
                    Map events API: {eventsUpstreamOk ? 'synced' : 'offline'}
                </span>
            </div>
        </div>
    )
}
