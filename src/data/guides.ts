/**
 * Guides — local articles + hub shortcuts (Skill Tree is linked only in prose where needed).
 */

import type { LearningDifficulty, LearningKind, LearningTag } from '@/data/learningShared'

export type GuideArticle = {
    slug: string
    title: string
    description: string
    kind: LearningKind
    difficulty: LearningDifficulty
    estimatedMinutes: number
    tags: LearningTag[]
    /** Ordered sections for detail page */
    sections: { heading: string; body: string }[]
    relatedSlugs?: string[]
    relatedTrialIds?: string[]
}

export type GuideHubShortcut = {
    id: string
    title: string
    summary: string
    href: string
    cta: string
    variant: 'internal' | 'metaforge'
}

export const GUIDE_HUB_SHORTCUTS: GuideHubShortcut[] = [
    {
        id: 'weekly-trials',
        title: 'Weekly Trials playlist',
        summary: 'This week’s rotation, every trial in the catalog, filters, and max-score playbooks.',
        href: '/trials',
        cta: 'Open Trials',
        variant: 'internal',
    },
    {
        id: 'roles-guide',
        title: 'Roles at a glance',
        summary: 'How Conditioning, Mobility, and Survival thinking shows up in squads — high level, no tree math.',
        href: '/guides/roles-at-a-glance',
        cta: 'Read guide',
        variant: 'internal',
    },
    {
        id: 'metaforge-reference',
        title: 'MetaForge reference',
        summary: 'Quests, arcs, items, and community reference — pair with RaiderForge for planning.',
        href: 'https://metaforge.app/arc-raiders',
        cta: 'Browse MetaForge',
        variant: 'metaforge',
    },
]

export const GUIDE_ARTICLES: GuideArticle[] = [
    {
        slug: 'weekly-trials-prep',
        title: 'Preparing for weekly Trials',
        description: 'Read the playlist, match trials to maps, and stack habits that survive bad RNG.',
        kind: 'tutorial',
        difficulty: 'casual',
        estimatedMinutes: 7,
        tags: ['trials', 'maps', 'teamplay', 'build'],
        relatedSlugs: ['roles-at-a-glance'],
        relatedTrialIds: ['trial-carriable-dash', 'trial-hornet-havoc'],
        sections: [
            {
                heading: 'Playlist first',
                body: 'Start on the Trials page with “This week’s” order — that’s your broadcast schedule. The full catalog below is for practice off-rotation and for comparing branches.',
            },
            {
                heading: 'Map alignment',
                body: 'Each trial card names a primary zone. Open the tactical map before you queue so callouts match rock geometry, not ping color.',
            },
            {
                heading: 'Score habits',
                body: 'Objectives usually beat padding kills. Agree in lobby whether you reset on a failed segment or push for survival time — mixed expectations waste runs.',
            },
        ],
    },
    {
        slug: 'roles-at-a-glance',
        title: 'Roles at a glance (Conditioning · Mobility · Survival)',
        description: 'Plain-language squad roles that align with how Trials and raids stress different kits.',
        kind: 'guide',
        difficulty: 'onboarding',
        estimatedMinutes: 5,
        tags: ['build', 'teamplay', 'trials'],
        relatedSlugs: ['weekly-trials-prep', 'economy-loot-basics'],
        sections: [
            {
                heading: 'Conditioning',
                body: 'Burst windows, elite deletes, and keeping pressure when the wave counter climbs. In Trials, this is often the score engine — protect their angle and reload cadence.',
            },
            {
                heading: 'Mobility',
                body: 'Route knowledge, vertical takes, and carriable timing. They translate map geometry into seconds on the clock; feed them intel instead of asking for raw DPS.',
            },
            {
                heading: 'Survival',
                body: 'Healing tempo, spread against splash, and calling retreats before downs cascade. A stable Survival anchor turns “almost wiped” into a recoverable score.',
            },
            {
                heading: 'Skill Tree',
                body: 'When you want point-level planning, use RaiderForge Skill Trees separately — this page stays conceptual so loadouts stay readable in voice chat.',
            },
        ],
    },
    {
        slug: 'live-conditions-and-rotation',
        title: 'Live conditions vs rotation fallback',
        description: 'What the Live panel and rotation fallback mean when MetaForge is empty or unreachable.',
        kind: 'reference',
        difficulty: 'casual',
        estimatedMinutes: 4,
        tags: ['conditions', 'reference'],
        relatedSlugs: ['weekly-trials-prep'],
        sections: [
            {
                heading: 'Live',
                body: 'Green-path data means we accepted a non-empty schedule from MetaForge recently. Modifiers still need in-raid verification — APIs lag storms.',
            },
            {
                heading: 'Fallback',
                body: 'Rotation tables keep the UI honest when the feed is empty or errors. Treat labels as “community rhythm,” not patch notes.',
            },
            {
                heading: 'Cached',
                body: 'Stale chips mean your client hasn’t seen a fresh payload in a while; the schedule may still be fine — watch for the next poll.',
            },
        ],
    },
    {
        slug: 'economy-loot-basics',
        title: 'Loot focus for progression',
        description: 'How to think about haul vs survival when both conflict mid-raid.',
        kind: 'guide',
        difficulty: 'casual',
        estimatedMinutes: 6,
        tags: ['loot', 'economy', 'teamplay'],
        relatedSlugs: ['weekly-trials-prep'],
        sections: [
            {
                heading: 'Bag discipline',
                body: 'Trials that reward speed punish full-loot detours. Mark one “scav” call if the mode allows, otherwise finish the objective chain first.',
            },
            {
                heading: 'Trader awareness',
                body: 'MetaForge lists traders and quest hooks — cross-check before you vendor a craft component you can’t re-roll easily.',
            },
        ],
    },
]

export function getGuideSlugs(): string[] {
    return GUIDE_ARTICLES.map((a) => a.slug)
}

export function getGuideBySlug(slug: string): GuideArticle | undefined {
    return GUIDE_ARTICLES.find((a) => a.slug === slug)
}

export function getRelatedGuides(slug: string, limit = 3): GuideArticle[] {
    const cur = getGuideBySlug(slug)
    if (!cur) return []
    const pool = GUIDE_ARTICLES.filter((a) => a.slug !== slug)
    const fromExplicit = (cur.relatedSlugs ?? [])
        .map((s) => getGuideBySlug(s))
        .filter((a): a is GuideArticle => Boolean(a))
    const rest = pool.filter((a) => !fromExplicit.some((e) => e.slug === a.slug))
    const scored = rest.map((a) => {
        let s = 0
        if (a.difficulty === cur.difficulty) s += 1
        for (const tag of a.tags) {
            if (cur.tags.includes(tag)) s += 1
        }
        return { a, s }
    })
    scored.sort((x, y) => y.s - x.s)
    const merged = [...fromExplicit, ...scored.map((x) => x.a)]
    const seen = new Set<string>()
    const out: GuideArticle[] = []
    for (const a of merged) {
        if (seen.has(a.slug)) continue
        seen.add(a.slug)
        out.push(a)
        if (out.length >= limit) break
    }
    return out
}

export const ALL_GUIDE_TAGS: LearningTag[] = Array.from(
    new Set(GUIDE_ARTICLES.flatMap((a) => a.tags)),
) as LearningTag[]

export function getGuidesForTrialId(trialId: string): GuideArticle[] {
    return GUIDE_ARTICLES.filter((a) => a.relatedTrialIds?.includes(trialId))
}
