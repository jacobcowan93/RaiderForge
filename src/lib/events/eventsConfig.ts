/**
 * eventsConfig.ts
 *
 * ARC Raiders dynamic events (map conditions) display config.
 * Event names derived from community research (arctracker.io / arcraidershub.com/events).
 * Icon URLs point to MetaForge's CDN (cdn.metaforge.app) — used with attribution.
 *
 * Attribution: Some ARC Raiders data provided by MetaForge (metaforge.app/arc-raiders)
 */

export const MAJOR_EVENTS: readonly string[] = [
  'Night Raid',
  'Hurricane',
  'Electromagnetic Storm',
  'Cold Snap',
  'Locked Gate',
  'Hidden Bunker',
] as const

export const MINOR_EVENTS: readonly string[] = [
  'Matriarch',
  'Harvester',
  'Prospecting Probes',
  'Lush Blooms',
  'Launch Tower Loot',
  'Husk Graveyard',
  'Bird City',
  'Uncovered Caches',
] as const

/** MetaForge CDN icon URLs for events. Attribution required. */
export const EVENT_ICONS: Record<string, string> = {
  Hurricane:               'https://cdn.metaforge.app/arc-raiders/custom/hurricane.webp',
  'Night Raid':            'https://cdn.metaforge.app/arc-raiders/custom/night.webp',
  'Locked Gate':           'https://cdn.metaforge.app/arc-raiders/custom/lockedgate.webp',
  Harvester:               'https://cdn.metaforge.app/arc-raiders/custom/harvester.webp',
  'Bird City':             'https://cdn.metaforge.app/arc-raiders/custom/birdcity.webp',
  'Cold Snap':             'https://cdn.metaforge.app/arc-raiders/custom/coldsnap.webp',
  Matriarch:               'https://cdn.metaforge.app/arc-raiders/custom/matriarch.webp',
  'Electromagnetic Storm': 'https://cdn.metaforge.app/arc-raiders/custom/electrical.webp',
  'Lush Blooms':           'https://cdn.metaforge.app/arc-raiders/custom/lush.webp',
  'Hidden Bunker':         'https://cdn.metaforge.app/arc-raiders/custom/hiddenbunker.webp',
  'Husk Graveyard':        'https://cdn.metaforge.app/arc-raiders/custom/husk-graveyard.webp',
  'Launch Tower Loot':     'https://cdn.metaforge.app/arc-raiders/custom/launchtowerloot.webp',
  'Uncovered Caches':      'https://cdn.metaforge.app/arc-raiders/custom/cache.webp',
}

export type EventColor = {
  bg: string
  border: string
  text: string
}

export const EVENT_COLORS: Record<string, EventColor> = {
  Hurricane:               { bg: 'rgba(99,154,255,0.15)',  border: 'rgba(99,154,255,0.5)',  text: '#7eb3ff' },
  'Electromagnetic Storm': { bg: 'rgba(168,99,255,0.15)',  border: 'rgba(168,99,255,0.5)',  text: '#c07aff' },
  'Night Raid':            { bg: 'rgba(212,43,43,0.15)',   border: 'rgba(212,43,43,0.5)',   text: '#ff6b6b' },
  'Cold Snap':             { bg: 'rgba(99,212,255,0.15)',  border: 'rgba(99,212,255,0.5)',  text: '#6fd8ff' },
  'Hidden Bunker':         { bg: 'rgba(255,185,50,0.15)',  border: 'rgba(255,185,50,0.5)',  text: '#ffc84a' },
  'Locked Gate':           { bg: 'rgba(150,100,255,0.15)', border: 'rgba(150,100,255,0.5)', text: '#b080ff' },
  Matriarch:               { bg: 'rgba(255,100,50,0.12)',  border: 'rgba(255,100,50,0.4)',  text: '#ff8060' },
  Harvester:               { bg: 'rgba(50,200,120,0.12)',  border: 'rgba(50,200,120,0.4)',  text: '#40c87a' },
  'Husk Graveyard':        { bg: 'rgba(180,140,80,0.12)',  border: 'rgba(180,140,80,0.4)',  text: '#c8a860' },
  'Bird City':             { bg: 'rgba(100,180,255,0.12)', border: 'rgba(100,180,255,0.4)', text: '#80c8ff' },
  'Launch Tower Loot':     { bg: 'rgba(255,220,80,0.12)',  border: 'rgba(255,220,80,0.4)',  text: '#ffe060' },
  'Lush Blooms':           { bg: 'rgba(80,200,120,0.12)',  border: 'rgba(80,200,120,0.4)',  text: '#60d88a' },
  'Prospecting Probes':    { bg: 'rgba(200,180,100,0.12)', border: 'rgba(200,180,100,0.4)', text: '#e0c870' },
}

const DEFAULT_COLOR: EventColor = {
  bg: 'rgba(108,99,255,0.12)',
  border: 'rgba(108,99,255,0.3)',
  text: '#8b7fff',
}

export function getEventStyle(name: string): EventColor {
  return EVENT_COLORS[name] ?? DEFAULT_COLOR
}

export function isMajorEvent(name: string): boolean {
  return (MAJOR_EVENTS as readonly string[]).includes(name)
}

/**
 * Short tooltip copy for map condition badges (sidebar, hub, live panel).
 * Community-sourced names; descriptions are editorial summaries for players.
 */
export const EVENT_DESCRIPTIONS: Record<string, string> = {
  Hurricane: 'Severe weather: reduced visibility and traversal pressure across the map.',
  'Electromagnetic Storm': 'Electrical interference — expect disrupted sensors or equipment-themed pressure.',
  'Night Raid': 'Night-time conditions with heightened ARC activity and pacing.',
  'Cold Snap': 'Freezing conditions — stamina and exposure matter more than usual.',
  'Hidden Bunker': 'Extra sealed areas or bunkers may be accessible this rotation.',
  'Locked Gate': 'Certain gates or routes are sealed; plan alternate paths.',
  Matriarch: 'Matriarch-class threat emphasis — expect heavier ARC presence.',
  Harvester: 'Harvester event active — high-value objective with concentrated risk.',
  'Husk Graveyard': 'Increased husk / remnant activity in marked sectors.',
  'Bird City': 'Avian-themed environmental or objective modifier on this rotation.',
  'Launch Tower Loot': 'Launch complex loot emphasis — Spaceport-relevant when live.',
  'Lush Blooms': 'Overgrowth or bloom effects altering sightlines and cover.',
  'Prospecting Probes': 'Extra probe / survey activity — watch for objective spawns.',
  'Uncovered Caches': 'More exposed caches and loot opportunities this cycle.',
}

export function getEventDescription(name: string): string {
  return (
    EVENT_DESCRIPTIONS[name] ??
    `Map modifier: ${name}. Check in-raid intel and community trackers for current effects.`
  )
}
