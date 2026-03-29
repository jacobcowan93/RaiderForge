import Link from 'next/link'

import { TrialCardHeroImage } from '@/components/trials/TrialCardHeroImage'
import type { TrialBrief } from '@/lib/trials/trialsData'

const TIER_STAR_COUNT: Record<TrialBrief['difficultyTier'], number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
}

function formatMaxShort(n: number): string {
    if (n >= 1000) return `${Math.round(n / 1000)}k`
    return String(n)
}

/** Stars + compact max badge over the circular art (in-game style). */
function ShieldImageOverlay({ tier, maxPoints }: { tier: TrialBrief['difficultyTier']; maxPoints: number }) {
    const n = TIER_STAR_COUNT[tier]
    const short = formatMaxShort(maxPoints)
    return (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
            <span className="flex items-center gap-px drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" aria-label={`${tier} difficulty`}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className={
                            i < n
                                ? 'text-[11px] leading-none text-stone-200/95'
                                : 'text-[11px] leading-none text-stone-600/95'
                        }
                        aria-hidden
                    >
                        ★
                    </span>
                ))}
            </span>
            <span className="flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-white px-1 text-[9px] font-black tabular-nums text-stone-800 shadow-md ring-1 ring-black/15">
                {short}
            </span>
        </div>
    )
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

    const titleBase =
        'block px-1 text-center text-xs font-black uppercase leading-tight tracking-wide text-white line-clamp-4 sm:text-sm'

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0a0a] shadow-lg shadow-black/50 transition-colors hover:border-white/[0.15]">
            <div className="flex h-full min-h-0 flex-1 flex-col pb-1.5 sm:pb-2">
                <div className="relative shrink-0 rounded-t-[14px] rounded-b-[2.35rem] bg-[#e8e4da] px-3 pb-6 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                    <p className="mb-3 text-center text-[10px] font-medium leading-snug tracking-tight text-stone-800 line-clamp-3 sm:text-[11px]">
                        {trial.description}
                    </p>
                    <div className="relative mx-auto flex w-full max-w-[180px] justify-center pb-1">
                        <TrialCardHeroImage
                            variant="shield"
                            src={trial.imageUrl}
                            alt={trial.name}
                            className="opacity-[0.98] transition-opacity duration-300 ease-out group-hover:opacity-100"
                        />
                        <ShieldImageOverlay tier={trial.difficultyTier} maxPoints={trial.maxPoints} />
                    </div>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col px-2 sm:px-2.5">
                    {detailHref ? (
                        <Link href={detailHref} className={`${titleBase} transition-colors hover:text-amber-100`}>
                            {trial.name}
                        </Link>
                    ) : (
                        <h3 className={titleBase}>{trial.name}</h3>
                    )}

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                        <div className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-center">
                            <p className="text-[6px] font-extrabold uppercase tracking-[0.12em] text-white/50 leading-none">Max</p>
                            <p className="font-mono text-[10px] font-black tabular-nums leading-none text-white/90">{maxPts}</p>
                        </div>
                    </div>

                    <div className="mt-2 border-t border-white/[0.08] pt-1.5">
                        <p className="mb-0.5 text-center text-[6px] font-bold uppercase tracking-[0.12em] text-sky-200/35 leading-none">
                            How to max
                        </p>
                        <ul className="grid gap-px text-[7px] leading-[1.08] text-white/[0.68] sm:text-[7.5px] sm:leading-[1.12]">
                            {trial.tips.map((tip, i) => (
                                <li key={i} className="flex gap-0.5">
                                    <span
                                        className="mt-[2px] h-0.5 w-0.5 shrink-0 rounded-[1px] bg-white/40"
                                        aria-hidden
                                    />
                                    <span className="min-w-0">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-auto flex shrink-0 flex-wrap gap-0.5 px-2 pt-1 sm:px-2.5">
                    {external ? (
                        <a
                            href={guide}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center gap-0.5 rounded-md border border-white/15 bg-white/[0.08] px-1 py-0.5 text-center text-[7px] font-bold uppercase tracking-wide text-white/95 transition-colors hover:bg-white/[0.12] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
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
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center rounded-md border border-white/15 bg-white/[0.08] px-1 py-0.5 text-center text-[7px] font-bold uppercase tracking-wide text-white/95 transition-colors hover:bg-white/[0.12] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
                        >
                            {guideLabel}
                        </Link>
                    )}
                    {detailHref ? (
                        <Link
                            href={detailHref}
                            className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1 py-0.5 text-center text-[7px] font-semibold text-white/80 transition-colors hover:border-white/18 hover:bg-white/[0.07] sm:min-h-[32px] sm:flex-initial sm:px-1.5 sm:text-[8px]"
                        >
                            Briefing
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    )
}
