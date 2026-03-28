import Image from 'next/image'
import Link from 'next/link'
import { getMapById } from '@/data/maps'
import type { TrialBranch, WeeklyTrial } from '@/data/trials'
import { formatEstimatedTime } from '@/data/learningShared'
import { mapCoverPath } from '@/lib/maps/mapCovers'
import { LearningDifficultyBadge } from '@/components/learning/LearningDifficultyBadge'
import { LearningTagList } from '@/components/learning/LearningTagList'

const BRANCH_SHORT: Record<TrialBranch, string> = {
    conditioning: 'Cond',
    mobility: 'Mob',
    survival: 'Surv',
}

const BRANCH_BORDER: Record<TrialBranch, string> = {
    conditioning: 'border-orange-500/30',
    mobility: 'border-sky-500/30',
    survival: 'border-emerald-500/30',
}

type Props = {
    trial: WeeklyTrial
    liveHint?: string | null
    /** Featured playlist styling */
    emphasize?: boolean
}

export function TrialSummaryCard({ trial, liveHint, emphasize }: Props) {
    const map = trial.mapRfId ? getMapById(trial.mapRfId) : undefined
    const cover = trial.mapRfId ? mapCoverPath(trial.mapRfId) : undefined
    const mapName = map?.displayName ?? 'Any zone'

    return (
        <article
            className={`rounded-xl border bg-black/40 overflow-hidden flex flex-col min-w-0 ${
                emphasize ? 'border-red-500/35 ring-1 ring-red-500/15' : `border-white/[0.08] ${BRANCH_BORDER[trial.branch]}`
            }`}
        >
            <Link href={`/trials/${trial.id}`} className="flex flex-col sm:flex-row flex-1 min-h-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/45 focus-visible:ring-inset">
                <div className="relative w-full sm:w-[140px] shrink-0 aspect-[16/10] sm:aspect-square sm:min-h-[140px] bg-rf-bgSoft">
                    {cover ? (
                        <Image
                            src={cover}
                            alt={`${mapName} — trial thumbnail`}
                            fill
                            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            sizes="(max-width: 640px) 100vw, 140px"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/30 px-2 text-center">
                            Multi-zone
                        </div>
                    )}
                    {trial.iconSrc ? (
                        <div className="absolute bottom-1.5 left-1.5 w-8 h-8 rounded-md bg-black/75 border border-white/10 p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={trial.iconSrc} alt="" className="w-full h-full object-contain" />
                        </div>
                    ) : null}
                </div>
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 border border-white/15 rounded px-1.5 py-0.5">
                            {BRANCH_SHORT[trial.branch]}
                        </span>
                        <LearningDifficultyBadge difficulty={trial.difficulty} compact />
                        <span className="text-[10px] text-white/35 tabular-nums">{formatEstimatedTime(trial.estimatedMinutes, 'focus')}</span>
                    </div>
                    <h3 className="text-base font-black text-white tracking-tight group-hover:text-rf-redSoft/95 transition-colors break-words">
                        {trial.name}
                    </h3>
                    <p className="text-xs text-white/45 mt-0.5 truncate sm:whitespace-normal sm:line-clamp-2">{mapName}</p>
                    <p className="text-sm text-white/55 mt-2 leading-snug line-clamp-2">{trial.shortDescription}</p>
                    <div className="mt-2">
                        <LearningTagList tags={trial.tags} max={4} />
                    </div>
                    {liveHint ? (
                        <p className="text-[10px] text-white/38 mt-2 border-l border-white/15 pl-2 line-clamp-2">{liveHint}</p>
                    ) : null}
                    <span className="inline-block mt-3 text-xs font-semibold text-rf-red/90">Open briefing →</span>
                </div>
            </Link>
        </article>
    )
}
