/**
 * Weekly Trials — command-center copy (max points, tips, guide links).
 * Merged with `src/data/trials.ts` rotations so “this week” matches the featured catalog.
 */

import type { LearningDifficulty } from '@/data/learningShared'
import type { TrialWeekBundle, WeeklyTrial } from '@/data/trials'
import { getFeaturedTrialWeek } from '@/data/trials'
import { getZoneThumbnailUrlOrFallback } from '@/lib/maps/mapCovers'

/** Player-facing tier for cards (maps catalog onboarding → Easy, casual → Medium, advanced → Hard). */
export type TrialDifficultyTier = 'Easy' | 'Medium' | 'Hard'

const DIFFICULTY_TO_TIER: Record<LearningDifficulty, TrialDifficultyTier> = {
    onboarding: 'Easy',
    casual: 'Medium',
    advanced: 'Hard',
}

export type TrialBrief = {
    trialId?: string
    /** MetaForge weekly-trials row id — stable key when `trialId` is absent. */
    sourceRowId?: string
    name: string
    description: string
    maxPoints: number
    tips: string[]
    /** Thematic card art under `/public/images/trials/` (SVG now; swap to same-basename `.jpg` later if desired). */
    imageUrl: string
    guideUrl?: string
    guideLabel?: string
    difficultyTier: TrialDifficultyTier
}

export type TrialWeekPresentation = {
    weekKey: string
    label: string
    subtitle?: string
    trials: TrialBrief[]
}

/** Extra fields keyed by `WeeklyTrial.id` — merged onto catalog trials for the tactical cards. */
export const TRIAL_COMMAND_BRIEFS: Record<
    string,
    {
        maxPoints: number
        tips: string[]
        imageUrl: string
        guideUrl?: string
        guideLabel?: string
        /** Overrides card description when set; else `WeeklyTrial.shortDescription` */
        description?: string
    }
> = {
    // ── Legacy named trials (local fallback rotation) ──────────────────────

    'trial-hornet-havoc': {
        maxPoints: 15_000,
        description: 'Hornet swarms escalate fast — chain staggers to reset their burst windows and hold choke angles so the pack never spreads past your reload.',
        imageUrl: '/images/trials/hornet-havoc.svg',
        tips: [
            'Run mag-size or reload-speed perks; one stagger tool (grenade or shotgun) per player so swarms never get a free volley during a reload.',
            'Hold elevated spillways with a rear exit — never dead-end in a pipe when the wave thickens.',
            'Clear sightlines before the hornet icon ticks; the first 5 seconds of each wave set your multiplier ceiling.',
            'One player kites low-HP stragglers wide while the rest tunnel the main pack — overlapping staggers prevent resets.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-hornets',
        guideLabel: 'MetaForge guide',
    },
    'trial-carriable-dash': {
        maxPoints: 12_500,
        description: 'Checkpoint deliveries reward pure route discipline — every second idle at a handoff zone or detoured to fight ARC is points left on the table.',
        imageUrl: '/images/trials/carriable-relay.svg',
        tips: [
            'Scout the pad order once in daylight before going hot — knowing the next checkpoint removes the 2–3s decision pause at each drop.',
            'Light armor only; the weight saving on every jump pad and slide chain compounds across 8+ handoffs.',
            'Drop carriables in cover-adjacent spots during handoffs — open-field swaps let ARC interrupt the pick-up animation.',
            'Escort uses smoke or flash for line-of-sight breaks, not kills; fighting off-route almost never beats the checkpoint score bonus.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/deliver-carriables',
        guideLabel: 'MetaForge guide',
    },
    'trial-bombardier-siege': {
        maxPoints: 18_000,
        description: 'Artillery patterns punish players who stay still — rotate diagonally after every salvo and spread across floors so splash can never hit two at once.',
        imageUrl: '/images/trials/bombardier-siege.svg',
        tips: [
            'Sustain loadout over raw DPS; one downed player kills the squad multiplier faster than low damage output does.',
            'After each salvo, move diagonally between cover blocks so Bombardiers re-target empty space instead of your last position.',
            'Spread vertically across different floors — stacking at ground level lets one splash wipe the whole team.',
            'Bank heals for post-salvo spikes; spending kits on chip damage between patterns leaves you empty when it counts.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-bombardiers',
        guideLabel: 'MetaForge guide',
    },
    'trial-lightning-gauntlet': {
        maxPoints: 16_500,
        description: 'Lightning paints sectors with a 1–2s warning before striking — pivot wide the instant the ground glows, then dump burst damage in the brief clear window.',
        imageUrl: '/images/trials/lightning-gauntlet.svg',
        tips: [
            'One dedicated caller announces “paint” / “clear” so the whole squad pivots on the same frame — staggered reactions reset streaks.',
            'Use burst or semi-auto fire in the 1–2s post-strike window only; greeding DPS through a painted tile resets your entire chain.',
            'Take wide arcs when repositioning — cutting across a lit sector to save distance loses more score than the distance saved.',
            'Avoid heavy armor; movement speed is more valuable than mitigation when escaping strike sectors.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/get-hit-by-lightning',
        guideLabel: 'MetaForge guide',
    },
    'trial-flying-arc-hunt': {
        maxPoints: 14_000,
        description: 'Stage at elevation, lead your shots, and keep ground-based ARC as a secondary priority only — every shot at a grounded enemy is wasted quota.',
        imageUrl: '/images/trials/flying-arc-hunt.svg',
        tips: [
            'Stage on gantries, towers, or elevated ledges — aerial ARC fly predictable travel lanes between structures that you can pre-aim.',
            'Lead your shots; Hornets and Wasps accelerate through turns so aim where they\'re going, not where they are.',
            'Reserve a full magazine for each flyer wave — dumping ammo into ground ARC leaves you dry when the cluster arrives.',
            'One caller assigns targets by clock position to prevent the squad double-focusing one unit while others escape.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-flying-arc-enemies',
        guideLabel: 'MetaForge guide',
    },
    'trial-frostline': {
        maxPoints: 17_500,
        description: 'Cold exposure stacks silently in wind tunnels and open crossings — commit to heated indoor loops, pull one ARC pack at a time, and let warmth do the healing.',
        imageUrl: '/images/trials/frostline-endurance.svg',
        tips: [
            'Plan your route through heated interiors before you land; never double-back through a wind tunnel even to chase a kill.',
            'Survival loadout with thermal gear — melee or rush builds burn through meds twice as fast in the cold.',
            'One pack at a time: crossfire in the frost stacks exposure faster than heals can clear it.',
            'One player calls the route; everyone else shoots on-call only to avoid accidental multi-pulls that force long cold fights.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+stella+cold+frost&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },

    // ── Live MetaForge trials — active this week ───────────────────────────

    'trial-damage-flying-arc': {
        maxPoints: 14_000,
        description: 'Damage any aerial ARC across the map — stage at elevation, lead every shot, and resist the urge to dump ammo into ground units.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-flying-arc-enemies.webp',
        tips: [
            'Stage on gantries, towers, or elevated ledges — aerial ARC fly predictable travel lanes between structures that you can pre-aim.',
            'Lead your shots; Hornets and Wasps accelerate through turns so aim where they\'re going, not where they are.',
            'Reserve a full magazine for each flyer wave — dumping ammo into ground ARC leaves you dry when the cluster arrives.',
            'One caller assigns targets by clock position to stop the squad double-focusing one unit while the rest escape.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-flying-arc-enemies',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-shredders': {
        maxPoints: 13_500,
        description: 'Shredders sprint in lateral bursts and close range in under two seconds — punish the side-exposure window as they commit to a charge rather than chasing them into the open.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/deal-damage-to-shredders.webp',
        tips: [
            'Hold doorways or slight elevation; Shredders can\'t navigate obstacles cleanly mid-charge, giving you a static aim window on their approach.',
            'Burst fire in the brief pause before each lateral dash — full-auto sprays wide as they zig-zag and wastes your damage window.',
            'Bring one stagger tool per player (shotgun or grenade); a staggered Shredder freezes briefly and gives the whole squad a free full mag.',
            'Never pull two packs simultaneously — each Shredder\'s hitbox shrinks during lateral sprints, so focused fire on one at a time is far more efficient.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/deal-damage-to-shredders',
        guideLabel: 'MetaForge guide',
    },

    'trial-loot-bird-nests': {
        maxPoints: 10_000,
        description: 'Bird nests sit on rooftops, ledges, and ruin crests — plan a vertical circuit before engaging any ARC, since nest looting rewards movement efficiency, not kills.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/loot-birds-nests.webp',
        tips: [
            'Know your map\'s nest ledges before landing: Dam spillway walls, Burial City roof tiers, and Spaceport gantries all host consistent spawns.',
            'Slide-jump chains cover vertical elevation fastest — learn the 2–3 high rooftops per zone that reliably have nests to skip dead traversal.',
            'Skip ARC packs near nests unless forced; this trial scores loot interactions, not kills, so fighting is pure time loss.',
            'All three squad members can loot the same nests for a shared count — coordinate circuits so nobody is retracing solo paths.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/loot-birds-nests',
        guideLabel: 'MetaForge guide',
    },

    'trial-traffic-tunnels': {
        maxPoints: 11_000,
        description: 'The Dam\'s underground tunnel network packs more containers per corridor than any surface zone — clear the ARC patrol once, then sprint back-to-back looting runs before enemies respawn.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/Containersunderground.webp',
        tips: [
            'Enter from the western vehicle ramp — it has the lightest initial ARC presence and gives you the full tunnel stretch in one unbroken line.',
            'The central junction hub holds the highest container density per footprint — prioritize it over the outer spur tunnels on a time-limited run.',
            'Clear all ARC on the first pass, then loop back for looting — fighting and opening containers simultaneously doubles your exposure time.',
            'Avoid tunnel runs during Hurricane or Night Raid; reduced visibility in enclosed spaces traps squads with no clean exit.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/open-containers-inside-the-traffic-tunnels',
        guideLabel: 'MetaForge guide',
    },

    'trial-search-husks': {
        maxPoints: 12_000,
        description: 'First Wave husks only appear in the opening raid window before standard patrols override them — insert fast, hit the outer patrol lanes while they\'re still active.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/search-first-wave-husks.webp',
        tips: [
            'Drop on the earliest insertion available — First Wave husks despawn or get replaced by standard ARC roughly 8–10 minutes into the raid.',
            'Focus outer sectors first: First Wave ARC concentrate at the map\'s perimeter before pushing toward central objectives.',
            'First Wave husks have a distinct darker shell coloring and idle pattern — learn to ID them at a glance to prioritize the right targets.',
            'Split the patrol loop: two players push outer lanes while one holds the entry route to hit the full quota before the window closes.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/search-first-wave-husks',
        guideLabel: 'MetaForge guide',
    },

    // ── Live MetaForge trials — upcoming next week ─────────────────────────

    'trial-west-highway': {
        maxPoints: 13_000,
        description: 'All ARC damage must land west of the highway on Dam Battlegrounds — orient your squad before the first shot so nobody bleeds fire across the road divide.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-flying-arc-enemies.webp',
        tips: [
            'Mark the highway as a hard stop at raid start; assign each player a western sector before engaging anything.',
            'The western industrial blocks and Dam spillway structures hold the highest ARC density west of the divide — push there first.',
            'Don\'t pursue fleeing enemies east of the road even for one shot; every point of damage on the wrong side is wasted quota.',
            'One player holds the nearest highway block as a funnel while others push deep west — enemies funneled toward the road give you controlled burst windows.',
        ],
        guideUrl: 'https://www.youtube.com/results?search_query=ARC+Raiders+Dam+west+highway+trial&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },

    'trial-damage-rocketeers': {
        maxPoints: 14_500,
        description: 'Rocketeers hover at mid-range and flash a lock-on before each salvo — pre-fire bursts during that aim window, then break line-of-sight before the rockets land.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-rocketeers.webp',
        tips: [
            'Mid-range precision weapons are ideal: Rocketeers hold stationary during their lock-on phase, giving you a clean unmoving target for 1–2s each cycle.',
            'Break cover between volleys — Rocketeers fire 2–3 rockets then reload; that pause is your repositioning window.',
            'Prioritize Rocketeers over flanking ARC: their burst can down a squad member through medium armor in one salvo.',
            'Rocketeers spawn at elevation on rooftops and catwalks — scan upward before entering new areas to avoid being caught in the open under a volley.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-rocketeers',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-wasps': {
        maxPoints: 12_500,
        description: 'Wasps swarm in tight clusters and close aggressively from above — strip the whole swarm with area fire before they scatter and force individual tracking.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-wasps.webp',
        tips: [
            'Position under or near large structures; Wasps cluster tightest when attacking from altitude, giving you the grouped burst window.',
            'Area-effect weapons (shotgun spread, grenade, spray auto-fire) hit the whole swarm in one burst — single-fire rifles waste time on swarming targets.',
            'Wasp patrols follow predictable loops; position ahead of a natural choke and open fire as the cluster passes through.',
            'Don\'t let the swarm split around cover — briefly commit to open ground to take the grouped burst, then re-cover before they rally.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-wasps',
        guideLabel: 'MetaForge guide',
    },

    'trial-disarm-mines': {
        maxPoints: 16_000,
        description: 'When Locked Gate activates, pressure mines seed across sealed routes — run the mine circuit before ARC patrols converge, and chain disarms without stopping for maximum count.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/disarm-mines-during-locked-gate.webp',
        tips: [
            'Locked Gate fires at a set UTC hour — check MetaForge map conditions before the raid so you\'re already inside the sealed zone when it triggers.',
            'Mines spawn in predictable clusters near sealed gates and narrow chokepoints — learn the 3–4 main spawn locations per map.',
            'Sprint between mines and time your disarm crouch; the crouched-sprint animation shaves roughly 0.8s per mine, which compounds across a full circuit.',
            'Bring a smoke grenade: ARC patrol activity spikes at gate clusters during Locked Gate, and smoke buys disarm time without forcing a fight.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/disarm-mines-during-locked-gate',
        guideLabel: 'MetaForge guide',
    },

    'trial-raider-caches': {
        maxPoints: 11_500,
        description: 'Raider Caches cluster near contested landmarks — sweep the outer ring while squads are still landing, then push central caches before the traffic peaks.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/search-raider-caches.webp',
        tips: [
            'Clear outer-ring caches in the first 2–3 minutes while other squads are still orienting — those see the least traffic early.',
            'Raider Caches show a distinct icon on the minimap; treat the run as a speed circuit, not a combat sweep.',
            'Search and move immediately — standing at an open cache is a top-tier ambush bait that other squads actively exploit.',
            'Pre-agree which caches to skip if contested; a forced fight costs more time and resources than any loot inside it.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/search-raider-caches',
        guideLabel: 'MetaForge guide',
    },

    // ── Other MetaForge trials (covers the full pool) ──────────────────────

    'trial-damage-bastions': {
        maxPoints: 16_000,
        description: 'Bastions soak frontal damage with heavy plating — flank to their exposed rear joints or side-vents for multiplied damage, and never stand in their push lane.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-bastions.webp',
        tips: [
            'All high-damage zones are rear and lateral — circle-strafe wide rather than standing in their frontal arc.',
            'Bastions telegraph a charge with a 1s wind-up; use that window to slide or vault to their blind side.',
            'Anti-armor or high-penetration weapons cut through plating far faster than standard rounds — adjust your loadout before the trial.',
            'Never stack as a squad in front of a Bastion; one charge hits multiple players and the shockwave interrupts reloads.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-bastions',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-leapers': {
        maxPoints: 13_000,
        description: 'Leapers arc high before lunging — track the apex of the jump to pre-aim the descent, then dump burst in the brief airborne window where they\'re most vulnerable.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-leapers.webp',
        tips: [
            'Fire at the apex of the jump — Leapers decelerate briefly at peak height before dropping, giving you the cleanest hit window.',
            'Shotguns and burst rifles are ideal; the lunge animation is short so you need high damage per shot, not sustained fire.',
            'Maintain medium range — too close and the lunge blurs past your aim, too far and the arc becomes hard to track.',
            'Call jump direction verbally — squad burst on the same landing point is far more efficient than each player tracking individually.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-leapers',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-queens': {
        maxPoints: 18_000,
        description: 'Queens and Matriarchs cycle attack phases with brief transition pauses — max score comes from coordinated burst during those 2–3s windows, not sustained fire during active abilities.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-queens-or-matriarchs.webp',
        tips: [
            'Learn the phase rotation: Queens pause 2–3s between abilities — that\'s your max-damage window, not during the active ability cast.',
            'One player calls phase transitions so the squad bursts together instead of spreading damage across different windows.',
            'Bring sustained DPS over spike damage; Queens have large health pools and consistent output beats single-burst builds over a full fight.',
            'Keep aggro spread: if the Queen fixates one player, the other two can freely deal damage from behind without interruption.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-queens-or-matriarchs',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-spotters': {
        maxPoints: 10_500,
        description: 'Spotters alert nearby ARC when they see you — eliminate them before they broadcast, and treat each confirmed kill as preventing the entire reinforced patrol they would have summoned.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-spotters.webp',
        tips: [
            'Spotters idle near elevated vantage points and doorways — check high ground first when entering a new zone.',
            'Suppressors or silenced weapons let you drop Spotters without alerting adjacent patrols; unsilenced fire costs you the next pack.',
            'Spotters have a distinct scanning animation before the alert — you have roughly 2s to fire after they lock onto your position.',
            'Prioritize Spotters over any other enemy in mixed groups; their alert multiplies total threat and extends the trial clock.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-spotters',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-snitches': {
        maxPoints: 10_000,
        description: 'Snitches are fast, fragile runners that broadcast your position — kill them before the pulse fires, or use area tools to delete the whole group in one go.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/Damage_Snitches.webp',
        tips: [
            'Snitches die in one or two shots — be fast; the broadcast pulse fires within 1.5s of them spotting you.',
            'Grenades and area-effect tools wipe small Snitch clusters before any single one can emit; look for grouped packs near objectives.',
            'Snitches scatter and gain speed when alerted — engage at medium range so you can track their erratic sprint.',
            'After a successful alert, Snitches stay active and will call again; clear the area fully, don\'t just suppress.',
        ],
        guideUrl: 'https://www.youtube.com/results?search_query=ARC+Raiders+damage+snitches+trial&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },

    'trial-destroy-small-arc': {
        maxPoints: 12_000,
        description: 'Ticks, Fireballs, and Pops are fragile and swarm in clusters — splash damage clears entire packs in one burst; single-fire ammo is wasted here.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/destroy-ticks-fireballs-and-pops.webp',
        tips: [
            'One grenade into a cluster earns more trial score than ten individual shots — bring area-capable weapons and let them group up.',
            'Ticks hug the ground, Pops hover low, Fireballs arc in — hold height so you have angle on all three sub-types at once.',
            'Don\'t chase individual units into cover; let them advance toward you and detonate on approach.',
            'In mixed encounters, clear the small swarm first — their sustained damage-per-second risk outweighs their threat rating.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/destroy-ticks-fireballs-and-pops',
        guideLabel: 'MetaForge guide',
    },

    'trial-download-bunker': {
        maxPoints: 15_500,
        description: 'Hidden Bunker opens a sealed facility with download terminals — clear the entry patrol before starting the progress bar, then hold both entry points through the full channel window.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/download-information-inside-the-bunker.webp',
        tips: [
            'Hidden Bunker fires at a set UTC hour — position near the entrance before it triggers to claim the first terminal before other squads.',
            'Clear all ARC inside before starting the download — interrupting the bar resets progress and wastes the event window.',
            'Two players guard the two bunker entry points while one handles the terminal; never leave access routes uncovered during the channel.',
            'Download progress is shared per terminal — don\'t split the squad across multiple terminals if one guard position is exposed.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/download-information-inside-the-bunker',
        guideLabel: 'MetaForge guide',
    },

    'trial-harvest-plants': {
        maxPoints: 9_000,
        description: 'Plants spawn in fixed clusters along map edges and near water features — circuit the known growth zones without stopping to fight, since ARC respawn faster than plants do.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/harvest-plants.webp',
        tips: [
            'Plant spawns are deterministic per map — learn the 4–6 consistent cluster locations and run them as a fixed loop each raid.',
            'Harvesting animations expose you; clear any nearby ARC before interacting, not during.',
            'If a cluster is heavily contested, skip it and lap back later rather than forcing a fight over a plant.',
            'Lush Blooms events increase plant density — check MetaForge map conditions and time your run with an active bloom cycle for maximum count.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/harvest-plants',
        guideLabel: 'MetaForge guide',
    },

    'trial-open-probes': {
        maxPoints: 11_000,
        description: 'ARC Probes sit in predictable patrol-adjacent positions — clear the nearby ARC first, then sprint the interact animation from a corner so you can\'t be flanked mid-open.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/open-arc-probes.webp',
        tips: [
            'Probes cluster near ARC patrol waypoints and objective structures — after clearing a patrol, check corners and alcoves in that footprint.',
            'The interact animation takes 2–3s and locks your movement; always face a wall or corner while opening.',
            'Don\'t over-clear: kill the 2–3 ARC adjacent to a probe, then open. Pushing the whole room wastes time on a collection trial.',
            'Mark probes on your squad HUD so nobody double-tags the same one and wastes circuit time.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/open-arc-probes',
        guideLabel: 'MetaForge guide',
    },

    'trial-supply-drops': {
        maxPoints: 10_500,
        description: 'Supply Drops land at timed intervals in open ground — get there before other squads, search fast, and exit before the second-wave ARC and player traffic converge.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/Search_Supply_Drops.webp',
        tips: [
            'Supply Drops show on the minimap when they land — rotate immediately; the first 60 seconds have minimal competition.',
            'ARC patrol density around drops increases over time; search and leave within 30s to avoid the convergence.',
            'Bring mobility over firepower; getting to the drop first matters more than winning the fight at it.',
            'If a squad is already contesting a drop, evaluate the fight cost vs. rotating to a secondary uncontested drop — rushing a held drop rarely pays out.',
        ],
        guideUrl: 'https://www.youtube.com/results?search_query=ARC+Raiders+supply+drop+search+trial&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },

    'trial-swamp-arc': {
        maxPoints: 13_000,
        description: 'The Swamp\'s dense foliage caps visibility to short range — rely on audio cues to pre-aim before you can see targets, and commit to aggressive pushes before ARC can flank through cover.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/destroy-arc-enemies-in-the-swamp.webp',
        tips: [
            'Reduce UI clutter and rely on audio — ARC movement sounds give 2–3s advance warning in dense foliage.',
            'Shotguns and SMGs outperform rifles in the Swamp\'s sub-30m engagement envelope.',
            'Hold the elevated ridges around the swamp floor — higher ground gives you sight advantage over low-visibility terrain below.',
            'Move through patrol paths aggressively; hesitating in the open while ARC use foliage cover is the fastest way to lose the engagement.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/destroy-arc-enemies-in-the-swamp',
        guideLabel: 'MetaForge guide',
    },

    'trial-damage-any-arc': {
        maxPoints: 10_000,
        description: 'No enemy restriction — maximize output by pulling the highest-density patrol routes and staying on whichever ARC type gives the cleanest sustained fire.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/Damage_any_ARC_enemies.webp',
        tips: [
            'Target heavy patrol corridors over isolated scouts — density multiplies your damage output per unit of time.',
            'Focus the full squad on one target at a time; split fire extends how long enemies stay in a fighting state and inflates DPS windows.',
            'High-ground positions with clean sightlines to patrol chokes are the highest-efficiency spots for this trial.',
            'Conserve ammo between pulls — this is a volume trial, so keeping reserves for back-to-back engagements beats burning out mid-run.',
        ],
        guideUrl: 'https://www.youtube.com/results?search_query=ARC+Raiders+damage+any+ARC+trial&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },

    'trial-damage-ground-arc': {
        maxPoints: 11_500,
        description: 'Ground-based ARC only — every shot at a Hornet or Wasp is wasted quota. Stay disciplined on surface patrol routes and funnel enemies through your sightlines.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/damage-ground-based-arc-enemies.webp',
        tips: [
            'Ignore all aerial ARC — discipline to stay off flyers is the core skill this trial tests.',
            'Pull patrol packs toward chokepoints or doorways so multiple ground ARC stack in your line of fire simultaneously.',
            'Burst builds outperform sustained DPS here; ground ARC have defined stagger windows that burst fire can chain.',
            'One player on flanking duty keeps ground ARC grouped and facing the main firing line — a flanked enemy turns and splits your team\'s fire.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/damage-ground-based-arc-enemies',
        guideLabel: 'MetaForge guide',
    },

    'trial-get-lightning': {
        maxPoints: 8_500,
        description: 'You need to get struck — not dodge the lightning. Stand in the painted sector center and let each strike land, then survive with sustain gear between hits.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/get-hit-by-lightning.webp',
        tips: [
            'Wear your heaviest sustain loadout and stock healing items — surviving multiple direct strikes, not avoiding them, is the objective.',
            'Stand in the painted center tile, not the edge; edge tiles can miss the strike while center tiles guarantee a hit.',
            'Between strikes, move to a fresh painted sector rather than waiting in the same spot — the second strike can land off-center on a repeat position.',
            'Only one squad member needs to absorb each strike; coordinate so you\'re not losing two players to the same bolt.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/get-hit-by-lightning',
        guideLabel: 'MetaForge guide',
    },

    'trial-medical-research': {
        maxPoints: 11_000,
        description: 'The Medical Research wing has a high container density but a confusing layout — enter from the secure side-corridor to skip the main ARC patrol and sweep back-to-front.',
        imageUrl: 'https://cdn.metaforge.app/arc-raiders/weekly-trials/search-containers-in-the-medical-research-wing.webp',
        tips: [
            'The secure corridor side-entrance bypasses the largest ARC patrol cluster; reach the back rooms first while other squads fight in.',
            'Containers spawn across two adjacent rooms — sweep both in the same pass rather than looping back, which adds 45–60s to the run.',
            'Open and move; stopping to inventory-manage at each container kills your per-room pace on what is fundamentally a speed circuit.',
            'Mark the wing entrance on the map before the raid — the layout is confusing under combat pressure and a wrong turn doubles your route.',
        ],
        guideUrl: 'https://metaforge.app/arc-raiders/search-containers-in-the-medical-research-wing',
        guideLabel: 'MetaForge guide',
    },
}

export const TRIALS_PAGE_MATURITY = 'live' as const

/** Build a command-center card from catalog data (used by MetaForge fallback rotation). */
export function buildTrialBriefFromWeekly(t: WeeklyTrial): TrialBrief {
    const extra = TRIAL_COMMAND_BRIEFS[t.id]
    const tips =
        extra?.tips ??
        t.maxScoreTips
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
    return {
        trialId: t.id,
        name: t.name,
        description: extra?.description ?? t.shortDescription,
        maxPoints: extra?.maxPoints ?? 12_000,
        tips: tips.length > 0 ? tips : ['See full briefing for scoring focus.'],
        imageUrl: extra?.imageUrl ?? (t.mapRfId ? getZoneThumbnailUrlOrFallback(t.mapRfId) : getZoneThumbnailUrlOrFallback('dam-battlegrounds')),
        guideUrl: extra?.guideUrl,
        guideLabel: extra?.guideLabel,
        difficultyTier: DIFFICULTY_TO_TIER[t.difficulty],
    }
}

export function mergeWeekBundle(bundle: TrialWeekBundle): TrialWeekPresentation {
    return {
        weekKey: bundle.weekId,
        label: bundle.label,
        subtitle: bundle.seasonNote,
        trials: bundle.trials.map(buildTrialBriefFromWeekly),
    }
}

export function getThisWeekPresentation(now: Date = new Date()): TrialWeekPresentation {
    return mergeWeekBundle(getFeaturedTrialWeek(now))
}

/** Next calendar week (UTC), same indexing as `getFeaturedTrialWeek`. */
export function getNextWeekPresentation(now: Date = new Date()): TrialWeekPresentation {
    return mergeWeekBundle(getFeaturedTrialWeek(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)))
}
