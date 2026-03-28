import type { MfEvent } from '@/lib/events/conditions'

import { shouldUseMetaForgeEventList } from './feedState'

/** Pass to getActiveConditionsForMap when MetaForge list should drive modifiers. */
export function metaForgeApiEventSlice(
    events: MfEvent[],
    upstreamOk: boolean | null,
): MfEvent[] | undefined {
    return shouldUseMetaForgeEventList(upstreamOk, events.length) ? events : undefined
}
