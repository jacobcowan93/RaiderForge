/**
 * skillTree.ts
 *
 * ARC Raiders skill tree — static data extracted from the MetaForge skill builder
 * (https://metaforge.app/arc-raiders/skill-builder).  No public API exposes this
 * data; it lives in the SvelteKit client bundle at metaforge.app.
 *
 * Three branches, 15 nodes each (45 total).
 *
 * Attribution: skill names / descriptions © Embark Studios / MetaForge.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type SkillBranch   = 'Conditioning' | 'Mobility' | 'Survival'
export type SkillNodeSize = 'major' | 'minor'
export type SkillNodeState = 'locked' | 'available' | 'partial' | 'maxed'

/**
 * A single skill node in the ARC Raiders skill tree.
 *
 * `id`            — per-branch positional key: "1", "2l", "2r", "5c", …
 * `uid`           — globally unique "{Branch}_{id}" (stable, used in save/URL)
 * `maxRanks`      — how many times this node can be purchased (1 or 5)
 * `pointGate`     — minimum branch-points that must be spent before this node
 *                   can be unlocked (0 = no gate, 15 = keystones, 36 = capstones)
 * `prerequisites` — per-branch `id` values that must have ≥1 rank before this
 *                   node becomes available
 */
export interface SkillNode {
    id:            string
    uid:           string
    branch:        SkillBranch
    name:          string
    description:   string
    maxRanks:      number
    pointGate:     number
    prerequisites: string[]
    size:          SkillNodeSize
}

// ── Branch metadata ───────────────────────────────────────────────────────────

export const BRANCH_META: Record<SkillBranch, {
    label:       string
    tagline:     string
    accentClass: string   // Tailwind text-color class
    borderClass: string   // Tailwind border-color class
    bgClass:     string   // Tailwind bg-color (subtle) for active node
    hex:         string   // raw hex for inline styles (SVG lines etc.)
}> = {
    Conditioning: {
        label:       'Conditioning',
        tagline:     'Toughness, shields, and melee power',
        accentClass: 'text-amber-400',
        borderClass: 'border-amber-500/60',
        bgClass:     'bg-amber-500/15',
        hex:         '#f59e0b',
    },
    Mobility: {
        label:       'Mobility',
        tagline:     'Movement, vaulting, and stamina',
        accentClass: 'text-sky-400',
        borderClass: 'border-sky-500/60',
        bgClass:     'bg-sky-500/15',
        hex:         '#38bdf8',
    },
    Survival: {
        label:       'Survival',
        tagline:     'Looting, crafting, and carry capacity',
        accentClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/60',
        bgClass:     'bg-emerald-500/15',
        hex:         '#10b981',
    },
}

// ── Tree topology constants ───────────────────────────────────────────────────

/** Column position for each node id-suffix. */
export const NODE_COL: Record<string, number> = {
    '1':  1,
    '2l': 0, '2r': 2,
    '3l': 0, '3r': 2,
    '4l': 0, '4r': 2,
    '5l': 0, '5c': 1, '5r': 2,
    '6l': 0, '6c': 1, '6r': 2,
    '7l': 0, '7r': 2,
}

/** Row (tier) for each node id prefix. */
export const NODE_ROW: Record<string, number> = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    '5': 4,
    '6': 5,
    '7': 6,
}

/** Returns [row, col] in the 7×3 branch grid. */
export function nodeGridPos(id: string): [row: number, col: number] {
    const prefix = id === '1' ? '1' : id[0]
    const row    = NODE_ROW[prefix] ?? 0
    const col    = NODE_COL[id]    ?? 1
    return [row, col]
}

/**
 * All prerequisite edges shared by every branch (topology is identical).
 * Expressed as [fromId, toId] pairs using per-branch IDs.
 */
export const TREE_EDGES: [string, string][] = [
    ['1',  '2l'],
    ['1',  '2r'],
    ['2l', '3l'],
    ['2r', '3r'],
    ['3l', '4l'],
    ['3r', '4r'],
    ['4l', '5l'],
    ['4l', '5c'],
    ['4r', '5c'],
    ['4r', '5r'],
    ['5l', '6l'],
    ['5c', '6c'],
    ['5r', '6r'],
    ['6l', '7l'],
    ['6c', '7l'],
    ['6c', '7r'],
    ['6r', '7r'],
]

// ── Skill data ────────────────────────────────────────────────────────────────

export const SKILL_NODES: SkillNode[] = [

    // ─────────────────────────────────────────── CONDITIONING ──────────────

    {
        id: '1', uid: 'Conditioning_1', branch: 'Conditioning',
        name: 'Used to the Weight',
        description: 'Wearing a shield slows you down less.',
        maxRanks: 5, pointGate: 0, prerequisites: [], size: 'major',
    },
    {
        id: '2l', uid: 'Conditioning_2l', branch: 'Conditioning',
        name: 'Blast-Born',
        description: 'Your hearing is less affected by nearby explosions.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '2r', uid: 'Conditioning_2r', branch: 'Conditioning',
        name: 'Gentle Pressure',
        description: 'You make less noise when breaching.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '3l', uid: 'Conditioning_3l', branch: 'Conditioning',
        name: 'Fight or Flight',
        description: 'When you\'re hurt in combat, regain stamina. Has a cooldown.',
        maxRanks: 5, pointGate: 0, prerequisites: ['2l'], size: 'minor',
    },
    {
        id: '3r', uid: 'Conditioning_3r', branch: 'Conditioning',
        name: 'Proficient Pryer',
        description: 'Breaching doors and containers takes less time.',
        maxRanks: 5, pointGate: 0, prerequisites: ['2r'], size: 'minor',
    },
    {
        id: '4l', uid: 'Conditioning_4l', branch: 'Conditioning',
        name: 'Survivor\'s Stamina',
        description: 'When critically hurt, stamina regenerates faster.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3l'], size: 'major',
    },
    {
        id: '4r', uid: 'Conditioning_4r', branch: 'Conditioning',
        name: 'Unburdened Roll',
        description: 'Shield break grants a free Dodge Roll within a few seconds.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3r'], size: 'major',
    },
    {
        id: '5l', uid: 'Conditioning_5l', branch: 'Conditioning',
        name: 'Downed but Determined',
        description: 'When downed, you have more time before collapsing.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4l'], size: 'minor',
    },
    {
        id: '5c', uid: 'Conditioning_5c', branch: 'Conditioning',
        name: 'A Little Extra',
        description: 'Breaching objects generates small amounts of resources.',
        maxRanks: 1, pointGate: 0, prerequisites: ['4l', '4r'], size: 'minor',
    },
    {
        id: '5r', uid: 'Conditioning_5r', branch: 'Conditioning',
        name: 'Effortless Swing',
        description: 'Melee abilities cost less stamina.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4r'], size: 'minor',
    },
    {
        id: '6l', uid: 'Conditioning_6l', branch: 'Conditioning',
        name: 'Turtle Crawl',
        description: 'While downed, you take less damage from incoming fire.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5l'], size: 'minor',
    },
    {
        id: '6c', uid: 'Conditioning_6c', branch: 'Conditioning',
        name: 'Loaded Arms',
        description: 'Your equipped weapon has less encumbrance impact.',
        maxRanks: 1, pointGate: 0, prerequisites: ['5c'], size: 'minor',
    },
    {
        id: '6r', uid: 'Conditioning_6r', branch: 'Conditioning',
        name: 'Sky-Clearing Swing',
        description: 'You deal more melee damage to ARC drones.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5r'], size: 'minor',
    },
    {
        id: '7l', uid: 'Conditioning_7l', branch: 'Conditioning',
        name: 'Back on Your Feet',
        description: 'Reaching critical health triggers health regeneration up to its limit.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6l', '6c'], size: 'major',
    },
    {
        id: '7r', uid: 'Conditioning_7r', branch: 'Conditioning',
        name: 'Flyswatter',
        description: 'Wasps and Turrets can be destroyed with a single melee attack.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6c', '6r'], size: 'major',
    },

    // ──────────────────────────────────────────────── MOBILITY ─────────────

    {
        id: '1', uid: 'Mobility_1', branch: 'Mobility',
        name: 'Nimble Climber',
        description: 'You can climb and vault more quickly.',
        maxRanks: 5, pointGate: 0, prerequisites: [], size: 'major',
    },
    {
        id: '2l', uid: 'Mobility_2l', branch: 'Mobility',
        name: 'Marathon Runner',
        description: 'Moving around costs less stamina.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '2r', uid: 'Mobility_2r', branch: 'Mobility',
        name: 'Slip and Slide',
        description: 'You can slide further and faster.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '3l', uid: 'Mobility_3l', branch: 'Mobility',
        name: 'Youthful Lungs',
        description: 'Increases your maximum stamina.',
        maxRanks: 5, pointGate: 0, prerequisites: ['2l'], size: 'minor',
    },
    {
        id: '3r', uid: 'Mobility_3r', branch: 'Mobility',
        name: 'Sturdy Ankles',
        description: 'You take less fall damage from non-lethal heights.',
        maxRanks: 5, pointGate: 0, prerequisites: ['2r'], size: 'minor',
    },
    {
        id: '4l', uid: 'Mobility_4l', branch: 'Mobility',
        name: 'Carry the Momentum',
        description: 'A Sprint Dodge Roll grants brief stamina-free sprinting afterward.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3l'], size: 'major',
    },
    {
        id: '4r', uid: 'Mobility_4r', branch: 'Mobility',
        name: 'Calming Stroll',
        description: 'Walking allows stamina to regenerate as if you were standing still.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3r'], size: 'major',
    },
    {
        id: '5l', uid: 'Mobility_5l', branch: 'Mobility',
        name: 'Effortless Roll',
        description: 'Dodge Rolls cost less stamina.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4l'], size: 'minor',
    },
    {
        id: '5c', uid: 'Mobility_5c', branch: 'Mobility',
        name: 'Crawl Before You Walk',
        description: 'When downed, you crawl faster.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4l', '4r'], size: 'minor',
    },
    {
        id: '5r', uid: 'Mobility_5r', branch: 'Mobility',
        name: 'Off the Wall',
        description: 'You can Wall Leap further distances.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4r'], size: 'minor',
    },
    {
        id: '6l', uid: 'Mobility_6l', branch: 'Mobility',
        name: 'Heroic Leap',
        description: 'You can Sprint Dodge Roll further.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5l'], size: 'minor',
    },
    {
        id: '6c', uid: 'Mobility_6c', branch: 'Mobility',
        name: 'Vigorous Vaulter',
        description: 'Vaulting no longer slows you when exhausted.',
        maxRanks: 1, pointGate: 0, prerequisites: ['5c'], size: 'minor',
    },
    {
        id: '6r', uid: 'Mobility_6r', branch: 'Mobility',
        name: 'Ready to Roll',
        description: 'Falling increases the timing window for a Recovery Roll.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5r'], size: 'minor',
    },
    {
        id: '7l', uid: 'Mobility_7l', branch: 'Mobility',
        name: 'Vaults on Vaults on Vaults',
        description: 'Vaulting no longer costs stamina.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6l', '6c'], size: 'major',
    },
    {
        id: '7r', uid: 'Mobility_7r', branch: 'Mobility',
        name: 'Vault Spring',
        description: 'Lets you jump at the end of a vault.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6c', '6r'], size: 'major',
    },

    // ──────────────────────────────────────────────── SURVIVAL ─────────────

    {
        id: '1', uid: 'Survival_1', branch: 'Survival',
        name: 'Agile Croucher',
        description: 'Your movement speed while crouching is increased.',
        maxRanks: 5, pointGate: 0, prerequisites: [], size: 'major',
    },
    {
        id: '2l', uid: 'Survival_2l', branch: 'Survival',
        name: 'Looter\'s Instincts',
        description: 'When searching containers, loot reveals faster.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '2r', uid: 'Survival_2r', branch: 'Survival',
        name: 'Revitalizing Squat',
        description: 'Stamina regeneration while crouched is increased.',
        maxRanks: 5, pointGate: 0, prerequisites: ['1'], size: 'minor',
    },
    {
        id: '3l', uid: 'Survival_3l', branch: 'Survival',
        name: 'Silent Scavenger',
        description: 'You make less noise when looting containers.',
        maxRanks: 5, pointGate: 0, prerequisites: ['2l'], size: 'minor',
    },
    {
        id: '3r', uid: 'Survival_3r', branch: 'Survival',
        name: 'In-Round Crafting',
        description: 'Unlocks the ability to field-craft items while topside.',
        maxRanks: 1, pointGate: 0, prerequisites: ['2r'], size: 'minor',
    },
    {
        id: '4l', uid: 'Survival_4l', branch: 'Survival',
        name: 'Suffer in Silence',
        description: 'Being at critical health reduces your movement noise.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3l'], size: 'major',
    },
    {
        id: '4r', uid: 'Survival_4r', branch: 'Survival',
        name: 'Good as New',
        description: 'Healing effects also increase stamina regeneration.',
        maxRanks: 1, pointGate: 15, prerequisites: ['3r'], size: 'major',
    },
    {
        id: '5l', uid: 'Survival_5l', branch: 'Survival',
        name: 'Broad Shoulders',
        description: 'Increases the maximum weight you can carry.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4l'], size: 'minor',
    },
    {
        id: '5c', uid: 'Survival_5c', branch: 'Survival',
        name: 'Traveling Tinkerer',
        description: 'Unlocks additional items available to field craft.',
        maxRanks: 1, pointGate: 0, prerequisites: ['4l', '4r'], size: 'minor',
    },
    {
        id: '5r', uid: 'Survival_5r', branch: 'Survival',
        name: 'Stubborn Mule',
        description: 'Stamina regeneration is less affected by being over-encumbered.',
        maxRanks: 5, pointGate: 0, prerequisites: ['4r'], size: 'minor',
    },
    {
        id: '6l', uid: 'Survival_6l', branch: 'Survival',
        name: 'Looter\'s Luck',
        description: 'Looting occasionally reveals twice as many items.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5l'], size: 'minor',
    },
    {
        id: '6c', uid: 'Survival_6c', branch: 'Survival',
        name: 'One Raider\'s Scraps',
        description: 'Raider containers rarely reveal additional crafted items.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5c'], size: 'minor',
    },
    {
        id: '6r', uid: 'Survival_6r', branch: 'Survival',
        name: 'Three Deep Breaths',
        description: 'Ability stamina drain is followed by faster recovery.',
        maxRanks: 5, pointGate: 0, prerequisites: ['5r'], size: 'minor',
    },
    {
        id: '7l', uid: 'Survival_7l', branch: 'Survival',
        name: 'Security Breach',
        description: 'Lets you breach Security Lockers.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6c', '6l'], size: 'major',
    },
    {
        id: '7r', uid: 'Survival_7r', branch: 'Survival',
        name: 'Minesweeper',
        description: 'Defuse mines and explosive deployables in your vicinity.',
        maxRanks: 1, pointGate: 36, prerequisites: ['6c', '6r'], size: 'major',
    },
]

// ── Derived lookups ───────────────────────────────────────────────────────────

/** Lookup by uid. */
export const SKILL_BY_UID = new Map<string, SkillNode>(
    SKILL_NODES.map((n) => [n.uid, n])
)

/** All nodes for a branch, in tier order. */
export function getSkillsByBranch(branch: SkillBranch): SkillNode[] {
    return SKILL_NODES.filter((n) => n.branch === branch)
}

/** UID → uid for a specific branch. */
export function toUid(branch: SkillBranch, id: string): string {
    return `${branch}_${id}`
}

/** Max total ranks purchasable in a branch. */
export function branchMaxPoints(branch: SkillBranch): number {
    return getSkillsByBranch(branch).reduce((sum, n) => sum + n.maxRanks, 0)
}

export const BRANCHES: SkillBranch[] = ['Conditioning', 'Mobility', 'Survival']
