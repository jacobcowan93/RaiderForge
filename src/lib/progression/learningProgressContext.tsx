'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { LearningPathStep, RecommendedLearningPath } from '@/data/learningPaths'
import {
    STORAGE_KEY,
    countActiveGuides,
    countActiveTrials,
    createEmptyProgress,
    loadProgressFromLocalStorage,
    parseStoredProgress,
    saveProgressToLocalStorage,
    setGuideStatus as applySetGuideStatus,
    setTrialStatus as applySetTrialStatus,
    toggleTrialChecklistItem,
    type LearningItemStatus,
    type LearningProgressPersistedV1,
    type StatusChangeResult,
} from '@/lib/progression/localProgressStore'
import { pathCompletionStats, stepsCompletionStats } from '@/lib/progression/pathCompletion'

type Result = { ok: true } | { ok: false; error: string }

type LearningProgressContextValue = {
    hydrated: boolean
    getGuideStatus: (slug: string) => LearningItemStatus
    getTrialStatus: (id: string) => LearningItemStatus
    setGuideStatus: (slug: string, next: LearningItemStatus) => Result
    setTrialStatus: (id: string, next: LearningItemStatus) => Result
    toggleTrialChecklistItem: (trialId: string, itemId: string) => void
    getTrialChecklist: (trialId: string) => Record<string, boolean>
    activeTrialCount: number
    activeGuideCount: number
    /** New “active” starts used this progress week (guides + trials combined). */
    inProgressStartsThisWeek: number
    resetAll: () => void
    pathCompletion: (path: RecommendedLearningPath) => ReturnType<typeof pathCompletionStats>
    stepsCompletion: (steps: LearningPathStep[]) => ReturnType<typeof stepsCompletionStats>
}

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null)

export function LearningProgressProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<LearningProgressPersistedV1>(() => createEmptyProgress())
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        setState(loadProgressFromLocalStorage())
        setHydrated(true)
    }, [])

    useEffect(() => {
        if (!hydrated) return
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue != null) {
                setState(parseStoredProgress(e.newValue))
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [hydrated])

    const persist = useCallback((next: LearningProgressPersistedV1) => {
        setState(next)
        saveProgressToLocalStorage(next)
    }, [])

    const getGuideStatus = useCallback(
        (slug: string): LearningItemStatus => state.guides[slug] ?? 'not_started',
        [state.guides],
    )

    const getTrialStatus = useCallback(
        (id: string): LearningItemStatus => state.trials[id] ?? 'not_started',
        [state.trials],
    )

    const setGuideStatus = useCallback(
        (slug: string, next: LearningItemStatus): Result => {
            const r = applySetGuideStatus(state, slug, next)
            if (r.ok) {
                persist(r.state)
                return { ok: true }
            }
            return { ok: false, error: (r as Extract<StatusChangeResult, { ok: false }>).error }
        },
        [persist, state],
    )

    const setTrialStatus = useCallback(
        (id: string, next: LearningItemStatus): Result => {
            const r = applySetTrialStatus(state, id, next)
            if (r.ok) {
                persist(r.state)
                return { ok: true }
            }
            return { ok: false, error: (r as Extract<StatusChangeResult, { ok: false }>).error }
        },
        [persist, state],
    )

    const toggleChecklist = useCallback(
        (trialId: string, itemId: string) => {
            persist(toggleTrialChecklistItem(state, trialId, itemId))
        },
        [persist, state],
    )

    const getTrialChecklist = useCallback(
        (trialId: string) => state.trialChecklists[trialId] ?? {},
        [state.trialChecklists],
    )

    const activeTrialCount = useMemo(() => countActiveTrials(state), [state])
    const activeGuideCount = useMemo(() => countActiveGuides(state), [state])
    const inProgressStartsThisWeek = state.inProgressStartsThisWeek

    const resetAll = useCallback(() => {
        const empty = createEmptyProgress()
        persist(empty)
    }, [persist])

    const pathCompletion = useCallback((path: RecommendedLearningPath) => pathCompletionStats(state, path), [state])

    const stepsCompletion = useCallback((steps: LearningPathStep[]) => stepsCompletionStats(state, steps), [state])

    const value = useMemo<LearningProgressContextValue>(
        () => ({
            hydrated,
            getGuideStatus,
            getTrialStatus,
            setGuideStatus,
            setTrialStatus,
            toggleTrialChecklistItem: toggleChecklist,
            getTrialChecklist,
            activeTrialCount,
            activeGuideCount,
            inProgressStartsThisWeek,
            resetAll,
            pathCompletion,
            stepsCompletion,
        }),
        [
            hydrated,
            getGuideStatus,
            getTrialStatus,
            setGuideStatus,
            setTrialStatus,
            toggleChecklist,
            getTrialChecklist,
            activeTrialCount,
            activeGuideCount,
            inProgressStartsThisWeek,
            resetAll,
            pathCompletion,
            stepsCompletion,
        ],
    )

    return <LearningProgressContext.Provider value={value}>{children}</LearningProgressContext.Provider>
}

export function useLearningProgress(): LearningProgressContextValue {
    const ctx = useContext(LearningProgressContext)
    if (!ctx) {
        throw new Error('useLearningProgress must be used within LearningProgressProvider')
    }
    return ctx
}
