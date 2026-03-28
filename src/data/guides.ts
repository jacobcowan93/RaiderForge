/**
 * Static hub tiles for /guides — RaiderForge-authored summaries.
 * Live MetaForge arcs/quests previews are loaded separately on the page (server).
 */

export type GuideHubTile = {
    id: string
    title: string
    summary: string
    href: string
    cta: string
    variant: 'internal' | 'metaforge'
}

export const GUIDE_HUB_TILES: GuideHubTile[] = [
    {
        id: 'weekly-trials',
        title: 'Weekly Trials & max score',
        summary:
            'Briefing for this week’s trial types: map focus, modifiers, and how to chase high scores with roles and map awareness.',
        href: '/trials',
        cta: 'Open Trials briefing',
        variant: 'internal',
    },
    {
        id: 'roles-overview',
        title: 'Roles at a glance (Conditioning · Mobility · Survival)',
        summary:
            'High-level how each branch tends to contribute in squads — complementing our on-site Skill Tree planner without replacing it.',
        href: '/skill-trees',
        cta: 'Open Skill Trees',
        variant: 'internal',
    },
    {
        id: 'maps-encounters',
        title: 'Maps & encounters',
        summary:
            'Jump into the command center for zone intel, TroubleChute links, tactical maps, and live MetaForge conditions when available.',
        href: '/maps',
        cta: 'Maps command center',
        variant: 'internal',
    },
    {
        id: 'metaforge-reference',
        title: 'MetaForge ARC Raiders reference',
        summary:
            'Deep quest, arc, item, and event reference on MetaForge — use it alongside RaiderForge tools for full community coverage.',
        href: 'https://metaforge.app/arc-raiders',
        cta: 'Browse MetaForge',
        variant: 'metaforge',
    },
]
