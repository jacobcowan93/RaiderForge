import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GuideArticleCard } from '@/components/learning/GuideArticleCard'
import { GuideDetailProgressToolbar } from '@/components/learning/GuideDetailProgressToolbar'
import { LearningDifficultyBadge } from '@/components/learning/LearningDifficultyBadge'
import { LearningTagList } from '@/components/learning/LearningTagList'
import { TrialSummaryCard } from '@/components/learning/TrialSummaryCard'
import { getGuideBySlug, getGuideSlugs, getRelatedGuides } from '@/data/guides'
import { formatEstimatedTime } from '@/data/learningShared'
import { getTrialById } from '@/data/trials'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'
import type { Metadata } from 'next'

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
    return getGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const article = getGuideBySlug(slug)
    if (!article) return { title: 'Guide — Raider Forge' }
    return {
        title: `${article.title} — Guides | Raider Forge`,
        description: article.description,
    }
}

export default async function GuideArticlePage({ params }: PageProps) {
    const { slug } = await params
    const article = getGuideBySlug(slug)
    if (!article) notFound()

    const related = getRelatedGuides(slug, 4)
    const relatedTrials = (article.relatedTrialIds ?? [])
        .map((id) => getTrialById(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))

    return (
        <div className="py-10 px-4 sm:px-6 max-w-3xl mx-auto">
            <nav className="text-xs text-white/40 mb-6">
                <Link href="/guides" className="text-rf-red/80 hover:text-rf-red font-medium">
                    ← Guides hub
                </Link>
            </nav>

            <header className="border-l-2 border-rf-red pl-5 mb-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <LearningDifficultyBadge difficulty={article.difficulty} />
                    <span className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">{article.kind}</span>
                    <span className="text-[10px] text-white/30 tabular-nums">{formatEstimatedTime(article.estimatedMinutes)}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words">
                    {article.title}
                </h1>
                <p className="text-sm text-white/60 mt-4 leading-relaxed max-w-2xl">{article.description}</p>
                <div className="mt-4">
                    <LearningTagList tags={article.tags} />
                </div>
            </header>

            <div className="mb-10 max-w-[42rem]">
                <GuideDetailProgressToolbar slug={article.slug} title={article.title} />
            </div>

            <article className="max-w-none">
                <div className="space-y-10 text-white/75 leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:tracking-tight [&_h2]:mt-0 [&_p]:text-sm [&_p]:leading-[1.7] max-w-[42rem]">
                    {article.sections.map((s) => (
                        <section key={s.heading}>
                            <h2>{s.heading}</h2>
                            <p className="whitespace-pre-wrap">{s.body}</p>
                        </section>
                    ))}
                </div>
            </article>

            {relatedTrials.length > 0 ? (
                <section className="mt-14 pt-10 border-t border-white/[0.08]" aria-labelledby="related-trials">
                    <h2 id="related-trials" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                        Related trials
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

            {related.length > 0 ? (
                <section className="mt-12 pt-10 border-t border-white/[0.08]" aria-labelledby="related-guides">
                    <h2 id="related-guides" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                        Related guides
                    </h2>
                    <ul className="grid grid-cols-1 gap-3 list-none p-0 m-0">
                        {related.map((a) => (
                            <li key={a.slug}>
                                <GuideArticleCard article={a} />
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <footer className="mt-14 pt-8 border-t border-white/[0.06] text-xs text-white/35">
                <p>
                    Deep data lives on{' '}
                    <a
                        href={METAFORGE_GUIDES_ATTRIBUTION.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rf-red/75 hover:text-rf-red underline underline-offset-2"
                    >
                        MetaForge
                    </a>
                    . Pair with <Link href="/trials" className="text-rf-red/75 hover:text-rf-red">Trials</Link> for a full prep loop.
                </p>
            </footer>
        </div>
    )
}
