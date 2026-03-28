import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuideArticleCard } from '@/components/learning/GuideArticleCard'
import { LearningDifficultyBadge } from '@/components/learning/LearningDifficultyBadge'
import { LearningTagList } from '@/components/learning/LearningTagList'
import { TrialSummaryCard } from '@/components/learning/TrialSummaryCard'
import { getGuidesForTrialId } from '@/data/guides'
import { formatEstimatedTime } from '@/data/learningShared'
import { getMapById } from '@/data/maps'
import { getAllTrialsCatalog, getRelatedTrials, getTrialById, type TrialBranch } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { formatLiveHintForMap } from '@/lib/trials/liveMapTrialHint'
import { mapCoverPath } from '@/lib/maps/mapCovers'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'
import type { Metadata } from 'next'
import type { MfEvent } from '@/lib/events/conditions'

const BRANCH_STYLE: Record<TrialBranch, string> = {
    conditioning: 'border-orange-500/35 bg-orange-500/10 text-orange-100/90',
    mobility: 'border-sky-500/35 bg-sky-500/10 text-sky-100/90',
    survival: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100/90',
}

type PageProps = { params: Promise<{ id: string }> }

export function generateStaticParams() {
    return getAllTrialsCatalog().map((t) => ({ id: t.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const trial = getTrialById(id)
    if (!trial) return { title: 'Trial — Raider Forge' }
    return {
        title: `${trial.name} — Trials | Raider Forge`,
        description: trial.shortDescription,
    }
}

export default async function TrialDetailPage({ params }: PageProps) {
    const { id } = await params
    const trial = getTrialById(id)
    if (!trial) notFound()

    const map = trial.mapRfId ? getMapById(trial.mapRfId) : undefined
    const cover = trial.mapRfId ? mapCoverPath(trial.mapRfId) : undefined
    const mapName = map?.displayName ?? 'Open maps'

    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [] as MfEvent[],
        fetchedAt: new Date().toISOString(),
        upstreamOk: false,
    }))
    const now = new Date()
    const liveLine =
        trial.mapRfId != null ? formatLiveHintForMap(trial.mapRfId, now, eventsPayload.events, eventsPayload.upstreamOk) : null

    const relatedTrials = getRelatedTrials(id, 4)
    const relatedGuides = getGuidesForTrialId(id)

    return (
        <div className="py-10 px-4 sm:px-6 max-w-3xl mx-auto">
            <nav className="text-xs text-white/40 mb-6">
                <Link href="/trials" className="text-rf-red/80 hover:text-rf-red font-medium">
                    ← Trials playlist
                </Link>
            </nav>

            <header className="rounded-xl border border-white/[0.08] bg-black/35 overflow-hidden mb-10">
                <div className="relative w-full aspect-[21/9] max-h-[200px] bg-rf-bgSoft">
                    {cover ? (
                        <Image
                            src={cover}
                            alt={`${mapName} — trial zone`}
                            fill
                            className="object-cover opacity-85"
                            sizes="(max-width: 768px) 100vw, 42rem"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/25 text-sm px-4 text-center">
                            Multi-zone trial
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${BRANCH_STYLE[trial.branch]}`}
                            >
                                {trial.branch}
                            </span>
                            <LearningDifficultyBadge difficulty={trial.difficulty} />
                            <span className="text-[10px] text-white/50 tabular-nums">
                                {formatEstimatedTime(trial.estimatedMinutes, 'focus')}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words">
                            {trial.name}
                        </h1>
                        <p className="text-xs text-white/50 mt-1">{mapName}</p>
                    </div>
                </div>
                <div className="px-5 sm:px-6 py-5 border-t border-white/[0.06]">
                    <p className="text-sm text-white/70 leading-relaxed max-w-2xl">{trial.shortDescription}</p>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <LearningTagList tags={trial.tags} />
                        {trial.mapRfId ? (
                            <Link
                                href={`/maps/${trial.mapRfId}`}
                                className="text-xs font-semibold text-rf-red/90 hover:text-rf-red ml-auto sm:ml-0"
                            >
                                Tactical map →
                            </Link>
                        ) : (
                            <Link href="/maps" className="text-xs font-semibold text-rf-red/90 hover:text-rf-red">
                                Maps hub →
                            </Link>
                        )}
                    </div>
                    {liveLine ? (
                        <p className="text-[11px] text-white/45 mt-4 border-l border-white/15 pl-3">
                            <span className="text-white/55 font-medium">{mapName} live: </span>
                            {liveLine}
                        </p>
                    ) : null}
                </div>
            </header>

            <div className="space-y-10 text-sm text-white/70 leading-relaxed max-w-[42rem]">
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">Modifiers</h2>
                    <p>{trial.modifiersSummary}</p>
                </section>
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">Scoring focus</h2>
                    <p>{trial.scoringFocus}</p>
                </section>
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-emerald-200/45 font-bold mb-2">Max score playbook</h2>
                    <p className="text-white/80">{trial.maxScoreTips}</p>
                </section>
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-red-300/45 font-bold mb-2">Avoid</h2>
                    <p className="text-white/60">{trial.avoid}</p>
                </section>
                <section>
                    <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">Role hint</h2>
                    <p>{trial.roleHint}</p>
                </section>
            </div>

            {relatedGuides.length > 0 ? (
                <section className="mt-14 pt-10 border-t border-white/[0.08]" aria-labelledby="related-guides">
                    <h2 id="related-guides" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                        Related guides
                    </h2>
                    <ul className="space-y-3 list-none p-0 m-0">
                        {relatedGuides.map((a) => (
                            <li key={a.slug}>
                                <GuideArticleCard article={a} />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            {relatedTrials.length > 0 ? (
                <section className="mt-12 pt-10 border-t border-white/[0.08]" aria-labelledby="related-trials">
                    <h2 id="related-trials" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                        More from the playlist
                    </h2>
                    <ul className="space-y-3 list-none p-0 m-0">
                        {relatedTrials.map((t) => (
                            <li key={t.id}>
                                <TrialSummaryCard trial={t} />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <footer className="mt-14 pt-8 border-t border-white/[0.06] text-xs text-white/35 text-center">
                <Link href="/guides" className="text-rf-red/75 hover:text-rf-red">
                    Guides hub
                </Link>
                {' · '}
                <a
                    href={METAFORGE_GUIDES_ATTRIBUTION.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rf-red/75 hover:text-rf-red underline underline-offset-2"
                >
                    MetaForge
                </a>
            </footer>
        </div>
    )
}
