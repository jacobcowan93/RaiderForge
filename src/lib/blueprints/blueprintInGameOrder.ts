/**
 * In-game blueprint collection menu order (10-column grid, row-major).
 *
 * Source layout:
 * - Page 1: `ARC_inGame_Blueprints_1` — 5×10 = 50 tiles (FOUND 74/74 header).
 * - Page 2: `ARC_inGame_Blueprints_2` — next 24 tiles (rows 1–2 full + first 4 of row 3).
 *
 * Names are **exact** spreadsheet allowlist labels (`trackerDisplayName`) so matcher output
 * lines up without fuzzy logic. Aliases only appear in comments where UI spelling differs.
 */

/** Page 1 — row-major, left-to-right, top-to-bottom (`ARC_inGame_Blueprints_1`). */
const IN_GAME_ORDER_PAGE_1: readonly string[] = [
    'Jolt Mine',
    'Padded Stock',
    'Deadline',
    'Silencer I',
    'Extended Barrel',
    'Combat Mk. 3 (Aggressive)',
    'Muzzle Brake II',
    'Compensator II',
    'Combat Mk. 3 (Flanking)',
    'Blaze Grenade',
    'Barricade Kit',
    'Tagging Grenade',
    'Vertical Grip II',
    'Bettina',
    'Aphelion Rifle',
    'Extended Light Mag II',
    'Muzzle Brake III',
    'Compensator III',
    'Shotgun Choke II',
    'Showstopper',
    'Remote Raider Flare',
    'Snap Hook',
    'Angled Grip II',
    'Osprey',
    'Equalizer',
    'Tactical Mk. 3 (Healing)',
    'Lightweight Stock',
    'Shotgun Silencer',
    'Looting Mk. 3 (Survivor)',
    'Bobcat',
    'Pulse Mine',
    'Burletta',
    'Defibrillator',
    'Explosive Mine',
    'Silencer II',
    'Anvil',
    'Jupitar',
    'Looting Mk. 3 (Safekeeper)',
    'Extended Shotgun Mag II',
    'Complex Gun Parts',
    'Vulcano',
    'Stable Stock II',
    'Trailblazer Grenade',
    'Medium Gun Parts',
    'Green Light Stick',
    'Angled Grip III',
    'Lure Grenade',
    'Tactical Mk. 3 (Defensive)',
    'Light Gun Parts',
    'Heavy Gun Parts',
]

/**
 * Page 2 — first 24 slots, row-major (`ARC_inGame_Blueprints_2`).
 * Completes the 74-name allowlist with the remaining items after page 1.
 */
const IN_GAME_ORDER_PAGE_2: readonly string[] = [
    'Tempest',
    "El' Toro",
    'Blue Light Stick',
    'Gas Mine',
    'Red Light Stick',
    'Venator',
    'Torrentte',
    'Vita Shot',
    'Smoke Grenade',
    'Wolfpack',
    'Hullcracker',
    'Vertical Grip III',
    'Seeker Grenade',
    'Firework Box',
    'Extended Medium Mag II',
    'Vita Spray',
    'Trigger Nade',
    'Tactical Mk. 3 (Revival)',
    'Extended Medium Mag III',
    'Extended Light Mag III',
    'Shotgun Choke III',
    'Extended Shotgun Mag III',
    'Stable Stock III',
    'Yellow Light Stick',
]

export const BLUEPRINT_IN_GAME_DISPLAY_ORDER: readonly string[] = [
    ...IN_GAME_ORDER_PAGE_1,
    ...IN_GAME_ORDER_PAGE_2,
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
