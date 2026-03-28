/**
 * Local-only learning progression (Trials + Guides). No backend.
 * Hard caps: concurrent "in progress" items + weekly starts of new in-progress items.
 */

export type LearningItemStatus = 'not_started' | 'in_progress' | 'completed'

export const STORAGE_KEY = 'rf-learning-progress-v1'

export const MAX_ACTIVE_TRIALS = 3
export const MAX_ACTIVE_GUIDES = 5
/** Max times per UTC-ish "progress week" a user can newly enter in_progress (from not started or completed). */
export const MAX_IN_PROGRESS_STARTS_PER_WEEK = 12

export type LearningProgressPersistedV1 = {
    v: 1
    guides: Record<string, LearningItemStatus>
    trials: Record<string, LearningItemStatus>
    /** trialId -> checklist item id -> done */
    trialChecklists: Record<string, Record<string, boolean>>
    weekKey: string
    inProgressStartsThisWeek: number
}

/** Same week bucketing as featured trial rotation (UTC, week index from Jan 1). */
export function currentProgressWeekKey(now = new Date()): string {
    const y = now.getUTCFullYear()
    const start = Date.UTC(y, 0, 1)
    const weekNo = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000 / 7)
    return `${y}-w${weekNo}`
}

export function createEmptyProgress(): LearningProgressPersistedV1 {
    return {
        v: 1,
        guides: {},
        trials: {},
        trialChecklists: {},
        weekKey: currentProgressWeekKey(),
        inProgressStartsThisWeek: 0,
    }
}

function normalizeWeek(state: LearningProgressPersistedV1, now = new Date()): LearningProgressPersistedV1 {
    const k = currentProgressWeekKey(now)
    if (state.weekKey === k) return state
    return { ...state, weekKey: k, inProgressStartsThisWeek: 0 }
}

export function countActiveTrials(state: LearningProgressPersistedV1): number {
    return Object.values(state.trials).filter((s) => s === 'in_progress').length
}

export function countActiveGuides(state: LearningProgressPersistedV1): number {
    return Object.values(state.guides).filter((s) => s === 'in_progress').length
}

function getTrialStatus(state: LearningProgressPersistedV1, id: string): LearningItemStatus {
    return state.trials[id] ?? 'not_started'
}

function getGuideStatus(state: LearningProgressPersistedV1, slug: string): LearningItemStatus {
    return state.guides[slug] ?? 'not_started'
}

export type StatusChangeResult =
    | { ok: true; state: LearningProgressPersistedV1 }
    | { ok: false; error: string }

export function setTrialStatus(
    rawState: LearningProgressPersistedV1,
    trialId: string,
    next: LearningItemStatus,
    now = new Date(),
): StatusChangeResult {
    let state = normalizeWeek({ ...rawState }, now)
    const prev = getTrialStatus(state, trialId)
    if (prev === next) return { ok: true, state }

    if (next === 'in_progress') {
        const wasActive = prev === 'in_progress'
        if (!wasActive) {
            const active = countActiveTrials(state)
            if (active >= MAX_ACTIVE_TRIALS) {
                return {
                    ok: false,
                    error: `You already have ${MAX_ACTIVE_TRIALS} active trials. Complete or clear one before adding another.`,
                }
            }
            if (state.inProgressStartsThisWeek >= MAX_IN_PROGRESS_STARTS_PER_WEEK) {
                return {
                    ok: false,
                    error: `Weekly focus limit reached (${MAX_IN_PROGRESS_STARTS_PER_WEEK} new active items this week). Complete items or wait for the next week.`,
                }
            }
            state = {
                ...state,
                trials: { ...state.trials, [trialId]: next },
                inProgressStartsThisWeek: state.inProgressStartsThisWeek + 1,
            }
            return { ok: true, state }
        }
    }

    const trials = { ...state.trials, [trialId]: next }
    return { ok: true, state: { ...state, trials } }
}

export function setGuideStatus(
    rawState: LearningProgressPersistedV1,
    slug: string,
    next: LearningItemStatus,
    now = new Date(),
): StatusChangeResult {
    let state = normalizeWeek({ ...rawState }, now)
    const prev = getGuideStatus(state, slug)
    if (prev === next) return { ok: true, state }

    if (next === 'in_progress') {
        const wasActive = prev === 'in_progress'
        if (!wasActive) {
            const active = countActiveGuides(state)
            if (active >= MAX_ACTIVE_GUIDES) {
                return {
                    ok: false,
                    error: `You already have ${MAX_ACTIVE_GUIDES} active guides. Complete or clear one before adding another.`,
                }
            }
            if (state.inProgressStartsThisWeek >= MAX_IN_PROGRESS_STARTS_PER_WEEK) {
                return {
                    ok: false,
                    error: `Weekly focus limit reached (${MAX_IN_PROGRESS_STARTS_PER_WEEK} new active items this week). Complete items or wait for the next week.`,
                }
            }
            state = {
                ...state,
                guides: { ...state.guides, [slug]: next },
                inProgressStartsThisWeek: state.inProgressStartsThisWeek + 1,
            }
            return { ok: true, state }
        }
    }

    const guides = { ...state.guides, [slug]: next }
    return { ok: true, state: { ...state, guides } }
}

export function toggleTrialChecklistItem(
    state: LearningProgressPersistedV1,
    trialId: string,
    itemId: string,
): LearningProgressPersistedV1 {
    const prevMap = state.trialChecklists[trialId] ?? {}
    const nextMap = { ...prevMap, [itemId]: !prevMap[itemId] }
    return {
        ...state,
        trialChecklists: { ...state.trialChecklists, [trialId]: nextMap },
    }
}

export function parseStoredProgress(raw: string | null): LearningProgressPersistedV1 {
    if (!raw) return createEmptyProgress()
    try {
        const j = JSON.parse(raw) as Partial<LearningProgressPersistedV1>
        if (j.v !== 1) return createEmptyProgress()
        const base = createEmptyProgress()
        return normalizeWeek({
            ...base,
            guides: typeof j.guides === 'object' && j.guides ? { ...j.guides } : {},
            trials: typeof j.trials === 'object' && j.trials ? { ...j.trials } : {},
            trialChecklists:
                typeof j.trialChecklists === 'object' && j.trialChecklists ? { ...j.trialChecklists } : {},
            weekKey: typeof j.weekKey === 'string' ? j.weekKey : base.weekKey,
            inProgressStartsThisWeek:
                typeof j.inProgressStartsThisWeek === 'number' ? j.inProgressStartsThisWeek : 0,
        })
    } catch {
        return createEmptyProgress()
    }
}

export function serializeProgress(state: LearningProgressPersistedV1): string {
    return JSON.stringify(state)
}

export function loadProgressFromLocalStorage(): LearningProgressPersistedV1 {
    if (typeof window === 'undefined') return createEmptyProgress()
    return parseStoredProgress(window.localStorage.getItem(STORAGE_KEY))
}

export function saveProgressToLocalStorage(state: LearningProgressPersistedV1): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, serializeProgress(state))
}
