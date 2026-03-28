'use client'

import type { GameSkillNode } from '@/lib/game-data/types'
import {
    clampAllocationForNode,
    emptySkillTreeSave,
    type SkillTreeSaveV1,
} from '@/lib/skill-tree/skillTreeSave'
import { loadSkillTreeSave, saveSkillTreeSave } from '@/lib/skill-tree/skillTreeSaveStorage'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function nodeCap(n: GameSkillNode): number {
    return n.maxPoints != null && n.maxPoints > 0 ? Math.min(n.maxPoints, 99) : 1
}

function pointsForNode(save: SkillTreeSaveV1, n: GameSkillNode): number {
    const raw = save.allocations[n.id] ?? 0
    return clampAllocationForNode(raw, n.maxPoints)
}

export default function SkillTreesPage() {
    const { data: session, status: sessionStatus } = useSession()
    const userMutatedRef = useRef(false)
    const saveRef = useRef<SkillTreeSaveV1>(emptySkillTreeSave())
    const persistenceRef = useRef<'local' | 'remote' | 'pending'>('local')

    const [save, setSave] = useState<SkillTreeSaveV1>(() =>
        typeof window === 'undefined' ? emptySkillTreeSave() : loadSkillTreeSave()
    )
    const [storageReady, setStorageReady] = useState(false)
    const [persistence, setPersistence] = useState<'local' | 'remote' | 'pending'>('local')

    const [nodes, setNodes] = useState<GameSkillNode[]>([])
    const [nodesLoading, setNodesLoading] = useState(true)
    const [nodesError, setNodesError] = useState<string | null>(null)

    saveRef.current = save
    persistenceRef.current = persistence

    useEffect(() => {
        setSave(loadSkillTreeSave())
        setPersistence('local')
        setStorageReady(true)
    }, [])

    useEffect(() => {
        if (!storageReady) return
        if (sessionStatus === 'loading') return

        if (sessionStatus === 'unauthenticated') {
            if (persistenceRef.current === 'remote') {
                saveSkillTreeSave(saveRef.current)
            } else {
                setSave(loadSkillTreeSave())
            }
            setPersistence('local')
            userMutatedRef.current = false
            return
        }

        const uid = session?.user?.id
        if (!uid) {
            if (persistenceRef.current === 'remote') {
                saveSkillTreeSave(saveRef.current)
            } else {
                setSave(loadSkillTreeSave())
            }
            setPersistence('local')
            userMutatedRef.current = false
            return
        }

        let cancelled = false
        setPersistence('pending')

        ;(async () => {
            const res = await fetch('/api/user/skill-tree', { credentials: 'same-origin' })
            if (cancelled) return

            if (res.status === 401 || res.status === 503 || !res.ok) {
                setPersistence('local')
                userMutatedRef.current = false
                return
            }

            const data = (await res.json()) as { save?: SkillTreeSaveV1 | null }
            let nextSave: SkillTreeSaveV1 =
                data.save === null || data.save === undefined
                    ? emptySkillTreeSave()
                    : {
                          version: 1,
                          allocations: {
                              ...(typeof data.save.allocations === 'object' &&
                              data.save.allocations !== null &&
                              !Array.isArray(data.save.allocations)
                                  ? (data.save.allocations as Record<string, number>)
                                  : {}),
                          },
                      }

            const serverEmpty = Object.keys(nextSave.allocations).length === 0
            if (serverEmpty) {
                const local = loadSkillTreeSave()
                if (Object.keys(local.allocations).length > 0) {
                    const seeded = await fetch('/api/user/skill-tree', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ save: local }),
                    })
                    if (seeded.ok) {
                        const r2 = await fetch('/api/user/skill-tree', { credentials: 'same-origin' })
                        if (r2.ok) {
                            const d2 = (await r2.json()) as { save?: SkillTreeSaveV1 | null }
                            if (d2.save && typeof d2.save.allocations === 'object' && d2.save.allocations !== null) {
                                nextSave = {
                                    version: 1,
                                    allocations: { ...(d2.save.allocations as Record<string, number>) },
                                }
                            }
                        }
                    }
                }
            }

            if (cancelled) return
            userMutatedRef.current = false
            setSave(nextSave)
            setPersistence('remote')
        })()

        return () => {
            cancelled = true
        }
    }, [storageReady, sessionStatus, session?.user?.id])

    useEffect(() => {
        if (!storageReady) return
        if (persistence !== 'local') return
        saveSkillTreeSave(save)
    }, [save, storageReady, persistence])

    useEffect(() => {
        if (!storageReady) return
        if (persistence !== 'remote') return
        if (!userMutatedRef.current) return

        const t = window.setTimeout(async () => {
            const payload = saveRef.current
            try {
                const res = await fetch('/api/user/skill-tree', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ save: payload }),
                })
                if (res.ok) userMutatedRef.current = false
            } catch {
                /* leave dirty */
            }
        }, 450)
        return () => window.clearTimeout(t)
    }, [save, persistence, storageReady])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setNodesLoading(true)
            setNodesError(null)
            try {
                const res = await fetch('/api/game/skilltree', { cache: 'no-store' })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data = (await res.json()) as { nodes?: unknown }
                const raw = Array.isArray(data.nodes) ? data.nodes : []
                const list: GameSkillNode[] = []
                for (const row of raw) {
                    if (row && typeof row === 'object' && typeof (row as GameSkillNode).id === 'string') {
                        list.push(row as GameSkillNode)
                    }
                }
                if (!cancelled) setNodes(list)
            } catch {
                if (!cancelled) setNodesError('Could not load skill data. Try again later.')
            } finally {
                if (!cancelled) setNodesLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const setPoints = useCallback((node: GameSkillNode, value: number) => {
        userMutatedRef.current = true
        const v = clampAllocationForNode(value, node.maxPoints)
        setSave((prev) => {
            const allocations = { ...prev.allocations }
            if (v <= 0) delete allocations[node.id]
            else allocations[node.id] = v
            return { version: 1, allocations }
        })
    }, [])

    const resetBuild = useCallback(() => {
        userMutatedRef.current = true
        setSave(emptySkillTreeSave())
    }, [])

    const byCategory = useMemo(() => {
        const m = new Map<string, GameSkillNode[]>()
        for (const n of nodes) {
            const key = n.category?.trim() || 'General'
            const arr = m.get(key) ?? []
            arr.push(n)
            m.set(key, arr)
        }
        for (const arr of m.values()) {
            arr.sort((a, b) => a.name.localeCompare(b.name))
        }
        return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
    }, [nodes])

    const totalAllocated = useMemo(
        () => Object.values(save.allocations).reduce((a, b) => a + b, 0),
        [save.allocations]
    )

    return (
        <div className="max-w-3xl mx-auto py-10 px-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Skill trees</h1>
                <p className="mt-2 text-sm text-rf-textSoft leading-relaxed">
                    Allocate points per node from live game data. Your build persists in this browser as a guest, or to your
                    account when signed in with cloud sync enabled.
                </p>
                {persistence === 'remote' ? (
                    <p className="mt-2 text-xs text-emerald-400/90">Build synced to your RaiderForge account.</p>
                ) : persistence === 'local' && sessionStatus === 'authenticated' ? (
                    <p className="mt-2 text-xs text-rf-textSoft/90">
                        Signed in, but cloud sync needs a database. This build stays on this device only.
                    </p>
                ) : null}
            </header>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                    type="button"
                    onClick={resetBuild}
                    className="rounded-lg border border-white/15 bg-rf-bg/80 px-3 py-2 text-xs font-semibold text-rf-text hover:border-rf-red/35 hover:text-white transition-colors"
                >
                    Reset build
                </button>
                <span className="text-xs text-rf-textSoft tabular-nums">
                    Points placed: <span className="text-white font-medium">{totalAllocated}</span>
                </span>
            </div>

            {nodesLoading && (
                <div className="rf-card rounded-xl p-8 border border-white/[0.06] animate-pulse space-y-3">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-20 bg-white/5 rounded" />
                </div>
            )}

            {nodesError && (
                <div className="rf-card rounded-xl p-6 border border-rf-red/25 text-rf-red text-sm">{nodesError}</div>
            )}

            {!nodesLoading && !nodesError && nodes.length === 0 && (
                <p className="text-sm text-rf-textSoft">No skill nodes returned from the data provider.</p>
            )}

            {!nodesLoading && !nodesError && nodes.length > 0 && (
                <div className="space-y-8">
                    {byCategory.map(([category, list]) => (
                        <section key={category} className="rf-card rounded-xl border border-white/[0.06] overflow-hidden">
                            <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold px-4 py-3 border-b border-white/[0.06] bg-black/20">
                                {category}
                            </h2>
                            <ul className="divide-y divide-white/[0.05]">
                                {list.map((n) => {
                                    const cap = nodeCap(n)
                                    const val = pointsForNode(save, n)
                                    return (
                                        <li key={n.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-white text-sm">{n.name}</span>
                                                    {n.isMajor ? (
                                                        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border border-sky-500/30 text-sky-300/90">
                                                            Major
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {n.description ? (
                                                    <p className="text-xs text-rf-textSoft mt-1 line-clamp-2">{n.description}</p>
                                                ) : null}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <label className="text-[10px] uppercase tracking-wider text-rf-textSoft whitespace-nowrap">
                                                    Points
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={cap}
                                                    value={val}
                                                    onChange={(e) => {
                                                        const nVal = parseInt(e.target.value, 10)
                                                        setPoints(n, Number.isFinite(nVal) ? nVal : 0)
                                                    }}
                                                    className="w-16 rounded-md bg-rf-bg/80 border border-white/10 px-2 py-1.5 text-sm text-white tabular-nums focus:outline-none focus:ring-1 focus:ring-rf-red/40"
                                                />
                                                <span className="text-[10px] text-white/35 whitespace-nowrap">/ {cap}</span>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}
