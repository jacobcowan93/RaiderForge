import Link from 'next/link'

import { TrialCardHeroImage } from '@/components/trials/TrialCardHeroImage'
import type { TrialBrief } from '@/lib/trials/trialsData'

const TIER_STYLES: Record<TrialBrief['difficultyTier'], string> = {
    Easy: 'border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-200/95',
    Medium: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-200/95',
    Hard: 'border-red-500/40 bg-red-950/40 text-red-200/95',
}

type Props = {
    trial: TrialBrief
}

export function TrialCommandCard({ trial }: Props) {
    const detailHref = trial.trialId ? `/trials/${trial.trialId}` : undefined
    const guide = trial.guideUrl ?? 'https://www.youtube.com/results?search_query=ARC+Raiders+trials'
    const guideLabel = trial.guideLabel ?? 'Best guide'
    const external = guide.startsWith('http')

    const maxPts = new Intl.NumberFormat('en-US').format(trial.maxPoints)
    const tierClass = TIER_STYLES[trial.difficultyTier]

    return (
        <article className="rf-card group relative flex h-full flex-col overflow-hidden rounded-lg border border-blue-950/45 border-l-[3px] border-l-rf-red bg-[#050810]/60 shadow-md shadow-black/50 transition-all hover:border-rf-red/25 hover:shadow-[0_0_28px_-8px_rgba(239,68,68,0.35)]">
            <div className="relative z-0 h-[4rem] w-full min-h-[4rem] shrink-0 overflow-hidden sm:h-[4.75rem] sm:min-h-[4.75rem]">
                <TrialCardHeroImage
                    src={trial.imageUrl}
                    alt={`${trial.name} — trial preview`}
                    className="opacity-95 transition-opacity group-hover:opacity-100"
                />
                <div
                    className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-[#050810] via-[#050810]/55 to-transparent"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 z-[1] opacity-[0.4] bg-[linear-gradient(rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[length:14px_14px]"
                    aria-hidden
                />
            </div>

            <div className="relative flex flex-1 flex-col px-1.5 py-1.5 sm:px-2 sm:py-1.5">
                <div className="mb-0.5 flex flex-wrap items-start gap-0.5 gap-y-0.5">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-0.5 mb-px">
                            <span
                                className={`inline-flex shrink-0 rounded border px-0.5 py-px text-[7px] font-extrabold uppercase tracking-wider ${tierClass}`}
                            >
                                {trial.difficultyTier}
                            </span>
                            {detailHref ? (
                                <Link
                                    href={detailHref}
                                    className="min-w-0 font-black text-[13px] leading-tight text-white tracking-tight transition-colors hover:text-rf-red sm:text-sm"
                                >
                                    {trial.name}
                                </Link>
                            ) : (
                                <h3 className="min-w-0 font-black text-[13px] leading-tight text-white tracking-tight sm:text-sm">
                                    {trial.name}
                                </h3>
                            )}
                        </div>
                        <p className="text-[9px] leading-snug text-white/55 sm:text-[10px]">{trial.description}</p>
                    </div>
                    <div className="shrink-0 rounded border border-rf-red/80 bg-gradient-to-br from-rf-red/28 to-red-950/60 px-0.5 py-px text-right shadow-[0_0_10px_-3px_rgba(239,68,68,0.5)] ring-1 ring-rf-red/40">
                        <p className="text-[4px] font-extrabold uppercase tracking-[0.08em] text-red-200/95 leading-none">
                            Max
                        </p>
                        <p className="font-mono text-[9px] font-black tabular-nums leading-none text-white sm:text-[10px]">
                            {maxPts}
                        </p>
                    </div>
                </div>

                <div className="mb-1 border-t border-white/[0.06] pt-0.5">
                    <p className="mb-px text-[6px] font-bold uppercase tracking-[0.1em] text-sky-200/40 leading-none">
                        How to max
                    </p>
                    <ul className="grid gap-px text-[7px] leading-[1.08] text-white/[0.72] sm:text-[7.5px] sm:leading-[1.12]">
                        {trial.tips.map((tip, i) => (
                            <li key={i} className="flex gap-0.5">
                                <span
                                    className="mt-[2px] h-0.5 w-0.5 shrink-0 rounded-[1px] bg-rf-red shadow-[0_0_4px_rgba(255,64,64,0.5)]"
                                    aria-hidden
                                />
                                <span className="min-w-0">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-auto flex flex-wrap gap-0.5 pt-px">
                    {external ? (
                        <a
                            href={guide}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center gap-0.5 rounded-md border border-rf-red/50 bg-rf-red px-1 py-0.5 text-center text-[7px] font-bold uppercase tracking-wide text-white shadow-[0_0_12px_-6px_rgba(239,68,68,0.55)] transition-colors hover:bg-[#e02020] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
                        >
                            {guideLabel}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2 w-2 opacity-90" aria-hidden>
                                <path
                                    fillRule="evenodd"
                                    d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                                    clipRule="evenodd"
                                />
                                <path
                                    fillRule="evenodd"
                                    d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.307a.75.75 0 0 0-.053 1.06Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </a>
                    ) : (
                        <Link
                            href={guide}
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center rounded-md border border-rf-red/50 bg-rf-red px-1 py-0.5 text-center text-[7px] font-bold uppercase tracking-wide text-white shadow-[0_0_12px_-6px_rgba(239,68,68,0.55)] transition-colors hover:bg-[#e02020] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
                        >
                            {guideLabel}
                        </Link>
                    )}
                    {detailHref ? (
                        <Link
                            href={detailHref}
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1 py-0.5 text-center text-[7px] font-semibold text-white/85 transition-colors hover:border-white/18 hover:bg-white/[0.07] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
                        >
                            Briefing
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    )
}
