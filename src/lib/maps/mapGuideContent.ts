/**
 * mapGuideContent.ts
 *
 * Curated per-map field guide content for RaiderForge map detail pages.
 *
 * DATA POLICY:
 *   All content in this file is presentational/editorial.
 *   - No loot probabilities or spawn rates.
 *   - No undocumented mechanics or fabricated POI coordinates.
 *   - Content is framed as tactical guidance, not live game data.
 *   Live data (quest counts, conditions, container counts) comes from
 *   real integrations (MetaForge, ARDB, local containers.ts) — not here.
 *
 * ADDING A MAP:
 *   Add a MapGuide entry to MAP_GUIDES keyed by the RaiderForge map ID
 *   (same IDs used in src/data/maps.ts and the [mapId] route param).
 *   If no guide exists for a map, the Field Guide section is suppressed
 *   gracefully — no placeholder copy is rendered.
 */

/**
 * A single named tactical location within a map.
 * Content is curated editorial — not sourced from any API or live data feed.
 * Descriptions use observational language: chokepoints, sightlines, exposure,
 * traversal pressure, verticality. No spawn tables or loot probabilities.
 */
export type Hotspot = {
  /** Short location name, 2–4 words. */
  name: string
  /** 1–2 sentence tactical character of this location. Curated editorial. */
  summary: string
}

export type MapGuide = {
  /**
   * 1-sentence use-case summary shown in the Recommended Focus callout.
   * Answers: "what kind of player or objective does this map suit best?"
   * Curated editorial — not sourced from any API.
   */
  bestFor: string

  /**
   * 1-sentence top tactical priority for this map.
   * Shown below bestFor in the callout strip.
   * Curated editorial — not sourced from any API.
   */
  recommendedFocus: string

  /**
   * Named tactical locations with observational summaries.
   * Describes chokepoints, exposure, sightlines, traversal character.
   * Curated editorial — not sourced from any API or live game data.
   * Omit or leave empty to suppress the Tactical Hotspots section.
   */
  hotspots?: Hotspot[]

  /**
   * 2–3 sentence environmental overview.
   * Describes pacing, terrain character, and threat profile.
   * Curated editorial — not sourced from any API.
   */
  whatToExpect: string

  /**
   * 3–5 tactical bullet points.
   * Practical tips for navigating and surviving the map.
   * Curated editorial — not sourced from any API.
   */
  tacticalNotes: string[]
}

export const MAP_GUIDES: Record<string, MapGuide> = {

  'dam-battlegrounds': {
    bestFor:          'High-value equipment salvage and contested industrial loot runs.',
    recommendedFocus: 'Secure the ridge early, clear river camp caches, then push the powerhouse core.',

    hotspots: [
      {
        name:    'Dam Gate',
        summary: 'The primary chokepoint between the north ridgeline and the dam structure itself. ' +
                 'Teams that hold the gate control the approach timing into the powerhouse; passing it without clearing sightlines above invites vertical pressure.',
      },
      {
        name:    'Northwest Bunker',
        summary: 'An elevated hardpoint with broad sightlines over the northwest approach corridor. ' +
                 'Lower entry exposure than the dam face makes it a strong early-game anchor before contesting the structure.',
      },
      {
        name:    'Powerhouse Core',
        summary: 'The highest-value zone on the map and the most confined. ' +
                 'Lateral movement inside is heavily restricted — entering without a pre-planned exit compounds every engagement.',
      },
      {
        name:    'River Camp',
        summary: 'Southern low-ground staging area with multiple exit angles back to the perimeter. ' +
                 'Consistent cache income relative to its exposure makes it a reliable early-run anchor before pushing the dam.',
      },
      {
        name:    'East Ridge',
        summary: 'Long sightline position overlooking the central dam approach. ' +
                 'High value for map control; limited return on investment if the objective is loot efficiency and clean extraction.',
      },
    ],

    whatToExpect:
      'The dam complex occupies a vast industrial footprint where open ridgeline approaches ' +
      'compress into tight, multi-level chokepoints at the dam structure itself. ARC presence ' +
      'escalates sharply toward the powerhouse core, and Harvester spawns impose hard time ' +
      'pressure on extended loot runs. The dam\'s reverberant interior carries sound unpredictably — ' +
      'noise discipline matters here more than it does on most maps.',
    tacticalNotes: [
      'Control the ridge positions early — they overlook the main approach corridors and give strong early-game information.',
      'The powerhouse interior is high-reward but commits you to a confined engagement zone; have a clear exit plan before entering.',
      'River camp caches are lower-risk targets good for building load-out before contesting the dam structure itself.',
      'Treat Harvester events as a hard extraction timer — continuing to loot after one activates significantly increases risk.',
      'Multiple extraction paths exist along the perimeter; identify your preferred route before pushing the dam core.',
    ],
  },

  'burial-city': {
    bestFor:          'Quest progression, trader rep building, and methodical cache income.',
    recommendedFocus: 'Map ARC nest positions on early runs, then execute efficient cache sweep routes.',

    hotspots: [
      {
        name:    'Central Market Ruins',
        summary: 'The intersection of three major road axes creates converging traversal pressure from multiple directions. ' +
                 'Moving through quickly is safer than stopping — this is a transit zone, not a hold position.',
      },
      {
        name:    'ARC Nest District',
        summary: 'The northwest residential sector concentrates the highest ARC activity on the map. ' +
                 'Cache spawns reliably appear in proximity to nest positions; the risk-reward tradeoff is steep but consistent.',
      },
      {
        name:    'High-Rise Tower',
        summary: 'The only true vertical anchor in the district, offering sightlines over extraction lanes inaccessible from street level. ' +
                 'Worth the climb for overwatch positioning late in a run.',
      },
      {
        name:    'Eastern Cache Line',
        summary: 'A series of consistent spawn positions along the eastern building facades. ' +
                 'Experienced players run it as a low-exposure sweep route before committing to the more contested interior zones.',
      },
      {
        name:    'Underground Access',
        summary: 'A lower-ground shortcut connecting the market district to the eastern zone. ' +
                 'Reduces surface exposure but narrows repositioning options significantly if engaged inside the passage.',
      },
    ],

    whatToExpect:
      'Dense, overgrown urban ruins favor methodical movement over aggressive pushes — sightlines ' +
      'are short, cover is constant, and ARC nests embedded in derelict structures create ' +
      'unpredictable engagement angles. Cache spawns make this a reliable map for steady hauls, ' +
      'but the maze-like district layout penalizes players who haven\'t learned the street axes. ' +
      'Medium risk profile makes it accessible, but careless movement in ARC nest sectors costs extractions.',
    tacticalNotes: [
      'Learn the primary road axes through the district — lateral movement is faster through buildings than along the exposed streets.',
      'ARC nests signal high-value loot nearby but guarantee resistance; approach with suppressed loadouts and clear in stages.',
      'Cache spawn locations are consistent between raids — mapping them early enables efficient, low-exposure sweeps.',
      'The ruined high-rises offer long vertical sightlines unavailable elsewhere on the map; worth controlling for extraction coverage.',
      'This is a strong map for quest progression and trader rep — moderate risk relative to quest density makes ROI favorable.',
    ],
  },

  'spaceport': {
    bestFor:          'Maximum-risk, maximum-reward extractions and high-tech salvage.',
    recommendedFocus: 'Stage through perimeter structures before the tower — never enter without a confirmed exit vector.',

    hotspots: [
      {
        name:    'Launch Pad',
        summary: 'The most exposed zone on any map in the rotation. ' +
                 'Wide-open tarmac with no meaningful cover; only cross with confirmed patrol timing or under active suppression.',
      },
      {
        name:    'Perimeter Outbuildings',
        summary: 'Lower-yield but substantially safer staging ground around the launch complex. ' +
                 'The outbuildings are essential for loading out and confirming patrol routes before committing to the tower approach.',
      },
      {
        name:    'Tower Base Entry',
        summary: 'The transition threshold between open ground and the vertical tower engagement. ' +
                 'Entering here removes the ability to reposition safely until you clear the structure or extract through it.',
      },
      {
        name:    'Gantry Level 3',
        summary: 'The mid-tower zone where sightlines intersect both upward and downward across the gantry structure. ' +
                 'Firefights here are multi-directional and decisive — standing still is not an option.',
      },
      {
        name:    'Tarmac Control Point',
        summary: 'Mid-ground zone between the outbuildings and the launch pad with full exposure to both positions. ' +
                 'Only worth contesting if you already hold the perimeter and need to advance under cover.',
      },
    ],

    whatToExpect:
      'The spaceport is the most punishing map in the rotation. Long open corridors around the ' +
      'launch pad provide minimal cover against heavy ARC patrols, and the launch tower interior ' +
      'compresses firefights into brutal vertical engagements across gantry levels. High-tech ' +
      'salvage rewards scale with the threat density — expect to fight for everything you extract. ' +
      'Teams that don\'t pre-plan extraction before entering the tower regularly don\'t leave it.',
    tacticalNotes: [
      'Approach the launch complex via perimeter structures, not the open pad — direct approaches across the tarmac are fully exposed.',
      'Secure the lower tower entrance and stairwells before ascending; entering from below without controlling vertical access is a trap.',
      'ARC patrol density here exceeds all other maps — spend time listening and identifying patrol timing before committing to a route.',
      'High-tech salvage concentrates near the launch infrastructure itself; outbuildings yield diminishing returns relative to risk.',
      'Confirm your extraction vector before the tower push — repositioning under fire in the launch complex is extremely difficult.',
    ],
  },

  'blue-gate': {
    bestFor:          'Resource farming, accessible POI runs, and freshly-loaded squad progression.',
    recommendedFocus: 'Run perimeter resource nodes first; only contest fortified positions when fully loaded.',

    hotspots: [
      {
        name:    'North Outpost',
        summary: 'The primary fortified position with an elevated firing deck that strongly advantages defenders. ' +
                 'Approaching from the east flank reduces frontal exposure considerably compared to a direct assault.',
      },
      {
        name:    'South Resource Corridor',
        summary: 'The lowest-risk traversal lane on the map with consistent node spawns and minimal ARC concentration. ' +
                 'A reliable income route that does not require contesting either fortified zone.',
      },
      {
        name:    'Open Field Crossing',
        summary: 'The mid-map exposed zone between the two outpost clusters with full line-of-sight from both positions. ' +
                 'Crossing here without confirmed patrol timing is the most common cause of early extractions on this map.',
      },
      {
        name:    'Vehicle Depot',
        summary: 'A mid-ground structure offering partial cover from both outpost firing angles. ' +
                 'Useful as a staging waypoint between zones but offers too little protection for extended stops.',
      },
      {
        name:    'East Approach Path',
        summary: 'The longer but lower-exposure route to the north outpost, bypassing the open field entirely. ' +
                 'Adds traversal time but significantly reduces approach sightline exposure for teams without map control.',
      },
    ],

    whatToExpect:
      'Blue Gate\'s mixed terrain — open ground punctuated by fortified structure clusters at ' +
      'the outpost positions — rewards squads that can control engagements at range before ' +
      'transitioning into tight clearing. ARC presence is moderate and distributed rather than ' +
      'concentrated, making systematic sweep routes viable. Resource nodes along the perimeter ' +
      'corridors offer reliable haul value without requiring you to contest the fortified zones.',
    tacticalNotes: [
      'Identify which fortified position is most active before committing — attempting both simultaneously invites flanks.',
      'Open terrain segments require awareness of ARC patrol timing; crossing without prior observation exposes you to mid-field contact.',
      'Perimeter resource nodes are low-risk, consistent haul targets — viable across multiple runs without high exposure.',
      'Elevated firing positions inside the outpost structures strongly favor defenders; use grenades or suppression rather than direct entry.',
      'Medium risk profile makes this viable for freshly-loaded squads, but the open zones punish poor positioning decisively.',
    ],
  },

  'stella-montis': {
    bestFor:          'Research-grade loot, multi-objective raids, and players comfortable with complex layouts.',
    recommendedFocus: 'Establish a lower-level foothold and confirmed exit before pushing the upper research wing.',

    hotspots: [
      {
        name:    'Upper Research Wing',
        summary: 'The highest-value loot concentration in the facility and the heaviest ARC density. ' +
                 'Approaching via the east corridor reduces initial exposure compared to entering through the main hall.',
      },
      {
        name:    'Main Stairwell',
        summary: 'The primary vertical connector between floors and the most contested single location in the facility. ' +
                 'Controlling it enables fluid floor transitions; fighting over it without positional advantage is expensive.',
      },
      {
        name:    'Lower Utility Bay',
        summary: 'Darker and more industrial than the upper level, with ARC patrol patterns that are more predictable in rhythm. ' +
                 'A viable income floor for teams not yet ready for the pressure of the research wing.',
      },
      {
        name:    'Observation Deck',
        summary: 'An exposed upper-level position with long outward sightlines covering extraction approaches. ' +
                 'Valuable for overwatch during late-run sequences; limited internal cover if contested from inside the facility.',
      },
      {
        name:    'Emergency Access Corridor',
        summary: 'A secondary vertical route between floors, less contested than the main stairwell but less direct. ' +
                 'Useful as an alternative when the stairwell is actively fought over or under ARC alert.',
      },
    ],

    whatToExpect:
      'Stella Montis demands command of its two-level layout. The upper research section features ' +
      'tight laboratory corridors and exposed observation decks; the lower utility floors are darker, ' +
      'more industrial, and ARC-dense. Navigation between levels is the central skill check — losing ' +
      'floor awareness in the facility costs extractions. Night Raid events activate additional ARC ' +
      'response and impose significant time pressure on teams that haven\'t pre-secured an exit.',
    tacticalNotes: [
      'Confirm your current floor before every engagement — upper and lower layouts share visual language and are easy to conflate under pressure.',
      'Stairwells and vertical access points are the highest-contest locations on the map; control them rather than rushing through.',
      'Research loot concentrates on the upper level but requires clearing through the heaviest ARC activity in the facility.',
      'During Night Raid conditions, prioritize establishing extraction readiness over loot completeness — timer pressure is severe.',
      'Lower level caches offer more predictable income with reduced ARC response — a viable strategy when the upper wing is on high alert.',
    ],
  },

}

/**
 * Retrieve the guide content for a given RF map ID.
 * Returns null if no guide has been authored for this map yet.
 */
export function getMapGuide(mapId: string): MapGuide | null {
  return MAP_GUIDES[mapId] ?? null
}
