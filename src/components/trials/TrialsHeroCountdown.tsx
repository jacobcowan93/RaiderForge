'use client'

import { useEffect, useState } from 'react'

function pad2(n: number) {
    return n.toString().padStart(2, '0')
}

type Props = {
    targetEpochMs: number
    metaforgeUpstreamOk: boolean
}

export function TrialsHeroCountdown({ targetEpochMs, metaforgeUpstreamOk }: Props) {
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

    return (
        <div className="w-full max-w-2xl">
            <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rf-red sm:text-xs">Resets in</p>
                    <p className="mt-1 text-[10px] text-white/40">
                        Next UTC Monday <span className="text-white/55">00:00</span> · estimate until rotation refresh
                    </p>
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
                    Replace this clock when Trials publish an official API —{' '}
                    <span className="text-white/50">until then, Monday UTC is our ops default</span>
                </span>
                <span className="hidden sm:inline text-white/15">|</span>
                <span
                    className={
                        metaforgeUpstreamOk
                            ? 'font-semibold text-emerald-400/90'
                            : 'font-semibold text-amber-200/75'
                    }
                >
                    MetaForge conditions: {metaforgeUpstreamOk ? 'synced' : 'offline'}
                </span>
            </div>
        </div>
    )
}
