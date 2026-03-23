/**
 * rotationTable.ts
 *
 * Community-derived fallback rotation for ARC Raiders map conditions.
 * This is NOT authoritative live data.
 *
 * Primary data source: MetaForge /events-schedule API endpoint.
 * This rotation is used ONLY when the live API is unavailable or returns an error.
 *
 * Source reference: Community-observed game behavior (ARC Raiders UTC hourly rotation).
 * Sourced from community research at arctracker.io / ARC Raiders community.
 * Update this table as the game's rotation changes.
 */

// Column layout per row (UTC hour 0–23):
// [damMinor, damMajor, buriedMinor, buriedMajor, spaceMinor, spaceMajor, blueMinor, blueMajor, stellaMinor, stellaMajor]
const ROTATION: readonly (readonly string[])[] = [
  ['',              'Hurricane',             'Husk Graveyard', '',          'Harvester',        'Electromagnetic Storm', '',           '',                      '', ''         ],
  ['Harvester',     '',                      '',               '',           'Launch Tower Loot','Hurricane',             '',           'Electromagnetic Storm', '', ''         ],
  ['',              'Electromagnetic Storm', 'Bird City',      'Hurricane',  '',                 '',                      'Matriarch',  '',                      '', 'Night Raid'],
  ['Husk Graveyard','',                      '',               'Cold Snap',  'Matriarch',        '',                      '',           'Hurricane',             '', ''         ],
  ['Matriarch',     'Hurricane',             'Husk Graveyard', '',           '',                 'Hidden Bunker',         '',           '',                      '', ''         ],
  ['',              '',                      '',               '',           '',                 'Hurricane',             'Harvester',  'Electromagnetic Storm', '', ''         ],
  ['',              'Electromagnetic Storm', 'Bird City',      'Hurricane',  'Harvester',        '',                      '',           '',                      '', 'Night Raid'],
  ['Harvester',     '',                      '',               'Night Raid', '',                 '',                      'Husk Graveyard','Hurricane',          '', ''         ],
  ['',              'Hurricane',             'Husk Graveyard', '',           '',                 'Electromagnetic Storm', 'Matriarch',  '',                      '', ''         ],
  ['Husk Graveyard','',                      '',               '',           'Matriarch',        'Hurricane',             '',           'Cold Snap',             '', ''         ],
  ['Matriarch',     'Electromagnetic Storm', 'Bird City',      'Hurricane',  '',                 '',                      '',           '',                      '', 'Night Raid'],
  ['',              '',                      '',               'Cold Snap',  '',                 '',                      'Harvester',  'Hurricane',             '', ''         ],
  ['',              'Hurricane',             'Husk Graveyard', '',           'Harvester',        'Cold Snap',             '',           '',                      '', ''         ],
  ['Harvester',     '',                      '',               '',           'Launch Tower Loot','Hurricane',             '',           'Electromagnetic Storm', '', ''         ],
  ['',              'Electromagnetic Storm', 'Bird City',      'Hurricane',  '',                 '',                      'Matriarch',  '',                      '', 'Night Raid'],
  ['Husk Graveyard','',                      '',               'Night Raid', 'Matriarch',        '',                      '',           'Hurricane',             '', ''         ],
  ['Matriarch',     'Hurricane',             'Husk Graveyard', '',           '',                 'Electromagnetic Storm', '',           '',                      '', ''         ],
  ['',              '',                      '',               '',           '',                 'Hurricane',             'Harvester',  'Electromagnetic Storm', '', ''         ],
  ['',              'Electromagnetic Storm', 'Bird City',      'Hurricane',  'Harvester',        '',                      '',           '',                      '', 'Night Raid'],
  ['Harvester',     '',                      '',               'Cold Snap',  '',                 '',                      'Husk Graveyard','Hurricane',          '', ''         ],
  ['',              'Hurricane',             'Husk Graveyard', '',           '',                 'Hidden Bunker',         'Matriarch',  '',                      '', ''         ],
  ['Husk Graveyard','',                      '',               '',           'Matriarch',        'Hurricane',             '',           'Cold Snap',             '', ''         ],
  ['Matriarch',     'Electromagnetic Storm', 'Bird City',      'Hurricane',  '',                 '',                      '',           '',                      '', 'Night Raid'],
  ['',              '',                      '',               'Night Raid', '',                 '',                      'Harvester',  'Hurricane',             '', ''         ],
] as const

// Map route ID -> column indices [minorIdx, majorIdx]
const MAP_COLS: Record<string, [number, number]> = {
  'dam-battlegrounds': [0, 1],
  'burial-city':       [2, 3],
  'spaceport':         [4, 5],
  'blue-gate':         [6, 7],
  'stella-montis':     [8, 9],
}

export type RotationResult = {
  minor: string | null
  major: string | null
}

/** Get fallback minor/major events for a map at a given UTC hour (0–23). */
export function getRotationForMap(mapId: string, utcHour: number): RotationResult {
  const cols = MAP_COLS[mapId]
  if (!cols) return { minor: null, major: null }
  const h = ((utcHour % 24) + 24) % 24
  const row = ROTATION[h]
  return {
    minor: row[cols[0]] || null,
    major: row[cols[1]] || null,
  }
}

/** Find the next hour (up to 24h away) that has any event for this map. */
export function getNextRotationEvent(
  mapId: string,
  utcHour: number
): { hoursAway: number; minor: string | null; major: string | null } | null {
  const cols = MAP_COLS[mapId]
  if (!cols) return null
  for (let i = 1; i <= 24; i++) {
    const h = (utcHour + i) % 24
    const row = ROTATION[h]
    const minor = row[cols[0]] || null
    const major = row[cols[1]] || null
    if (minor || major) return { hoursAway: i, minor, major }
  }
  return null
}

/** Format a millisecond countdown as MM:SS or H:MM:SS. */
export function fmtCountdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
