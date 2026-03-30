import Link from 'next/link'

import { TrialCardHeroImage } from '@/components/trials/TrialCardHeroImage'
import type { TrialBrief } from '@/lib/trials/trialsData'

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
        'mt-3 block text-center text-xs font-black uppercase leading-tight tracking-wide text-white line-clamp-4 sm:text-sm'

    return (
        <article className="group flex h-full min-h-0 flex-col">
            <TrialCardHeroImage
                variant="shield"
                src={trial.imageUrl}
                alt={trial.name}
                className="opacity-[0.98] group-hover:opacity-100"
            />

            {detailHref ? (
                <Link href={detailHref} className={`${titleBase} transition-colors hover:text-amber-100`}>
                    {trial.name}
                </Link>
            ) : (
                <h3 className={titleBase}>{trial.name}</h3>
            )}

            <p className="mt-2 text-center font-mono text-[10px] font-black tabular-nums leading-none text-white/90">{maxPts}</p>

            <div className="mt-2 rounded-md border border-white/18 bg-black/25 px-2.5 py-2 sm:px-3 sm:py-2.5">
                <p className="text-center text-sm font-medium leading-snug tracking-tight text-zinc-200/90 line-clamp-4 sm:text-base">
                    {trial.description}
                </p>
            </div>

            <div className="mt-2 rounded-md border border-white/18 bg-black/25 px-2.5 py-2 sm:px-3 sm:py-2.5">
                <p className="mb-0.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-sky-200/55 leading-none">
                    How to max
                </p>
                <ul className="grid gap-px text-xs leading-relaxed text-zinc-200/85 sm:text-sm sm:leading-relaxed">
                    {trial.tips.map((tip, i) => (
                        <li key={i} className="flex gap-0.5">
                            <span className="mt-[2px] shrink-0" aria-hidden>
                                •
                            </span>
                            <span className="min-w-0">{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-auto flex shrink-0 flex-wrap gap-0.5">
                {external ? (
                    <a
                        href={guide}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center gap-0.5 text-center text-[7px] font-bold uppercase tracking-wide text-white/95 transition-colors hover:text-white sm:min-h-[32px] sm:flex-initial sm:text-[8px]"
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
                        className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center text-center text-[7px] font-bold uppercase tracking-wide text-white/95 transition-colors hover:text-white sm:min-h-[32px] sm:flex-initial sm:text-[8px]"
                    >
                        {guideLabel}
                    </Link>
                )}
                {detailHref ? (
                    <Link
                        href={detailHref}
                        className="inline-flex min-h-[30px] flex-1 min-w-[5rem] items-center justify-center text-center text-[7px] font-semibold text-white/80 transition-colors hover:text-white/95 sm:min-h-[32px] sm:flex-initial sm:text-[8px]"
                    >
                        Briefing
                    </Link>
                ) : null}
            </div>
        </article>
    )
}
