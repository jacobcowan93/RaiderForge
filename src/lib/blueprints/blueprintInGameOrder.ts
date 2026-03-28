/**
 * In-game blueprint collection menu display order (74 tiles).
 *
 * This array controls **sort order only** when using `ingame_asc`. Inclusion in the tracker
 * still comes from the spreadsheet allowlist + conservative matcher. Labels match allowlist
 * `trackerDisplayName` exactly.
 */

export const BLUEPRINT_IN_GAME_DISPLAY_ORDER: readonly string[] = [
    'Bettina',
    'Blue Light Stick',
    'Aphelion Rifle',
    'Combat Mk. 3 (Flanking)',
    'Combat Mk. 3 (Aggressive)',
    'Complex Gun Parts',
    'Firework Box',
    'Gas Mine',
    'Green Light Stick',
    'Pulse Mine',
    'Seeker Grenade',
    'Looting Mk. 3 (Survivor)',
    'Angled Grip II',
    'Angled Grip III',
    'Hullcracker',
    'Anvil',
    'Barricade Kit',
    'Blaze Grenade',
    'Bobcat',
    'Osprey',
    'Burletta',
    'Compensator II',
    'Compensator III',
    'Defibrillator',
    'Equalizer',
    'Extended Barrel',
    'Extended Light Mag II',
    'Extended Light Mag III',
    'Extended Medium Mag II',
    'Extended Medium Mag III',
    'Extended Shotgun Mag II',
    'Extended Shotgun Mag III',
    'Remote Raider Flare',
    'Heavy Gun Parts',
    'Venator',
    "El' Toro",
    'Jolt Mine',
    'Explosive Mine',
    'Jupitar',
    'Light Gun Parts',
    'Lightweight Stock',
    'Looting Mk. 3 (Safekeeper)',
    'Lure Grenade',
    'Medium Gun Parts',
    'Torrentte',
    'Muzzle Brake II',
    'Muzzle Brake III',
    'Padded Stock',
    'Shotgun Choke II',
    'Shotgun Choke III',
    'Shotgun Silencer',
    'Showstopper',
    'Silencer I',
    'Silencer II',
    'Snap Hook',
    'Stable Stock II',
    'Stable Stock III',
    'Tagging Grenade',
    'Tempest',
    'Trigger Nade',
    'Vertical Grip II',
    'Vertical Grip III',
    'Vita Shot',
    'Vita Spray',
    'Vulcano',
    'Wolfpack',
    'Red Light Stick',
    'Smoke Grenade',
    'Tactical Mk. 3 (Revival)',
    'Deadline',
    'Trailblazer Grenade',
    'Tactical Mk. 3 (Defensive)',
    'Tactical Mk. 3 (Healing)',
    'Yellow Light Stick',
]

if (BLUEPRINT_IN_GAME_DISPLAY_ORDER.length !== 74) {
    throw new Error(
        `[blueprints] BLUEPRINT_IN_GAME_DISPLAY_ORDER must have 74 entries, got ${BLUEPRINT_IN_GAME_DISPLAY_ORDER.length}`
    )
}

const indexByLabel = new Map<string, number>()
for (let i = 0; i < BLUEPRINT_IN_GAME_DISPLAY_ORDER.length; i++) {
    indexByLabel.set(BLUEPRINT_IN_GAME_DISPLAY_ORDER[i]!, i)
}

const warnedMissingGameOrder = new Set<string>()

/**
 * Sort key for `trackerDisplayName` / allowlist label. Unknown labels sort last (stable tie-break).
 */
export function blueprintGameOrderIndex(displayLabel: string | null | undefined): number {
    const key = displayLabel?.trim()
    if (!key) return 99999
    const idx = indexByLabel.get(key)
    if (idx === undefined) {
        if (process.env.NODE_ENV === 'development' && !warnedMissingGameOrder.has(key)) {
            warnedMissingGameOrder.add(key)
            console.warn('[blueprints] No in-game order index for label:', key)
        }
        return 99999
    }
    return idx
}

export function warnIfAllowlistDriftFromGameOrder(allowlistNames: readonly string[]): void {
    if (process.env.NODE_ENV !== 'development') return
    const set = new Set(allowlistNames)
    for (const n of BLUEPRINT_IN_GAME_DISPLAY_ORDER) {
        if (!set.has(n)) console.warn('[blueprints] In-game order lists name not on allowlist:', n)
    }
    for (const n of allowlistNames) {
        if (!indexByLabel.has(n)) console.warn('[blueprints] Allowlist name missing from in-game order:', n)
    }
}
