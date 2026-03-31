/**
 * TEMPORARY upstream: Mahcks community ARC Raiders Data API
 * (https://github.com/Mahcks/arcraiders-data-api — live: https://arcdata.mahcks.com)
 *
 * - Unofficial / community-maintained; replace when an official Embark API exists.
 * - Keep all Mahcks-specific request/response handling inside this file + `normalize/*`.
 * - Do not import this module from UI components; use `getGameDataProvider()` or `/api/game/*` only on the server.
 *
 * Data ultimately traces to RaidTheory/arcraiders-data per upstream docs.
 */

import { withGameDataCache } from '../cache'
import { fetchUpstreamJson, UpstreamGameDataError } from '../fetchUpstream'
import { normalizeGameItem } from '../normalize/items'
import { normalizeGameMap } from '../normalize/maps'
import { normalizeGameMapEventsBundle } from '../normalize/mapEvents'
import { normalizeGameProject } from '../normalize/projects'
import { normalizeGameQuest } from '../normalize/quests'
import { normalizeGameSkillNode } from '../normalize/skillNodes'
import type { GameDataProvider } from '../provider'
import type {
    GameDataPage,
    GameItem,
    GameMap,
    GameMapEventsBundle,
    GameProject,
    GameQuest,
    GameSkillNode,
    GameTrade,
} from '../types'

const DEFAULT_BASE = 'https://arcdata.mahcks.com'

/** TTL: balance freshness vs hammering community upstream */
const TTL_MAPS_MS = 30 * 60 * 1000
const TTL_PROJECTS_MS = 30 * 60 * 1000
const TTL_SKILL_MS = 30 * 60 * 1000
const TTL_EVENTS_MS = 15 * 60 * 1000
const TTL_QUESTS_MS  = 20 * 60 * 1000
const TTL_TRADES_MS  = 30 * 60 * 1000
const TTL_ITEMS_PAGE_MS = 12 * 60 * 1000
const TTL_SINGLE_ITEM_MS = 15 * 60 * 1000

const DEFAULT_ITEM_LIMIT = 45

type MahcksPaginated<T> = {
    type?: string
    total?: number
    count?: number
    offset?: number
    limit?: number
    items?: T[]
    next?: string | null
}

function baseUrl(): string {
    const b = process.env.ARC_GAME_DATA_BASE_URL?.trim() || DEFAULT_BASE
    return b.replace(/\/$/, '')
}

function url(path: string): string {
    const b = baseUrl()
    if (path.startsWith('http')) return path
    return path.startsWith('/') ? `${b}${path}` : `${b}/${path}`
}

export class MahcksGameDataProvider implements GameDataProvider {
    readonly id = 'mahcks'

    async getMaps(): Promise<GameMap[]> {
        return withGameDataCache('mahcks:v1:maps', TTL_MAPS_MS, async () => {
            const raw = await fetchUpstreamJson<unknown[]>(url('/v1/maps'), { revalidateSeconds: 1800 })
            if (!Array.isArray(raw)) return []
            const out: GameMap[] = []
            for (const row of raw) {
                const m = normalizeGameMap(row)
                if (m) out.push(m)
            }
            return out
        })
    }

    async getProjects(): Promise<GameProject[]> {
        return withGameDataCache('mahcks:v1:projects', TTL_PROJECTS_MS, async () => {
            const raw = await fetchUpstreamJson<unknown[]>(url('/v1/projects'), { revalidateSeconds: 1800 })
            if (!Array.isArray(raw)) return []
            const out: GameProject[] = []
            for (const row of raw) {
                const p = normalizeGameProject(row)
                if (p) out.push(p)
            }
            return out
        })
    }

    async getSkillNodes(): Promise<GameSkillNode[]> {
        return withGameDataCache('mahcks:v1:skill-nodes', TTL_SKILL_MS, async () => {
            const raw = await fetchUpstreamJson<unknown[]>(url('/v1/skill-nodes'), { revalidateSeconds: 1800 })
            if (!Array.isArray(raw)) return []
            const out: GameSkillNode[] = []
            for (const row of raw) {
                const s = normalizeGameSkillNode(row)
                if (s) out.push(s)
            }
            return out
        })
    }

    async getMapEventsBundle(): Promise<GameMapEventsBundle> {
        return withGameDataCache('mahcks:v1:map-events:full', TTL_EVENTS_MS, async () => {
            const raw = await fetchUpstreamJson<unknown>(url('/v1/map-events?full=true'), {
                revalidateSeconds: 600,
            })
            return normalizeGameMapEventsBundle(raw)
        })
    }

    async getQuests(): Promise<GameQuest[]> {
        return withGameDataCache('mahcks:v1:quests:all', TTL_QUESTS_MS, async () => {
            // Step 1 — fetch the ID list (no full=true; endpoint doesn't support it)
            const list = await fetchUpstreamJson<{ count?: number; items?: Array<{ id: string }> }>(
                url('/v1/quests'),
                { revalidateSeconds: 900 },
            )
            const ids = (list.items ?? []).map((i) => i.id).filter(Boolean)

            // Step 2 — fetch each quest individually with concurrency
            const concurrency = 10
            const out: GameQuest[] = []
            for (let i = 0; i < ids.length; i += concurrency) {
                const batch = ids.slice(i, i + concurrency)
                const settled = await Promise.allSettled(
                    batch.map((id) =>
                        fetchUpstreamJson<unknown>(url(`/v1/quests/${encodeURIComponent(id)}`), {
                            revalidateSeconds: 900,
                        }),
                    ),
                )
                for (const r of settled) {
                    if (r.status === 'fulfilled') {
                        const q = normalizeGameQuest(r.value)
                        if (q) out.push(q)
                    }
                }
            }
            return out
        })
    }

    async getTrades(): Promise<GameTrade[]> {
        return withGameDataCache('mahcks:v1:trades', TTL_TRADES_MS, async () => {
            const raw = await fetchUpstreamJson<unknown[]>(url('/v1/trades'), {
                revalidateSeconds: 1800,
            })
            if (!Array.isArray(raw)) return []
            const out: GameTrade[] = []
            for (const row of raw) {
                if (!row || typeof row !== 'object') continue
                const r = row as Record<string, unknown>
                const trader     = typeof r.trader     === 'string' ? r.trader.trim()     : null
                const itemId     = typeof r.itemId     === 'string' ? r.itemId.trim()     : null
                const quantity   = typeof r.quantity   === 'number' ? r.quantity          : Number(r.quantity) || 1
                const cost       = r.cost as Record<string, unknown> | null
                const costItemId = cost && typeof cost.itemId   === 'string' ? cost.itemId.trim()           : null
                const costQty    = cost && typeof cost.quantity === 'number' ? cost.quantity : Number(cost?.quantity) || 1
                const daily      = r.dailyLimit != null ? (typeof r.dailyLimit === 'number' ? r.dailyLimit : Number(r.dailyLimit) || null) : null
                if (trader && itemId && costItemId) {
                    out.push({ trader, itemId, quantity, costItemId, costQuantity: costQty, dailyLimit: daily })
                }
            }
            return out
        })
    }

    async getItemsPage(params: { limit: number; offset: number }): Promise<GameDataPage<GameItem>> {
        const limit = Math.min(Math.max(1, params.limit), 90)
        const offset = Math.max(0, params.offset)
        const cacheKey = `mahcks:v1:items:full:${limit}:${offset}`

        return withGameDataCache(cacheKey, TTL_ITEMS_PAGE_MS, async () => {
            const data = await fetchUpstreamJson<MahcksPaginated<unknown>>(
                url(`/v1/items?full=true&limit=${limit}&offset=${offset}`),
                { revalidateSeconds: 600 }
            )
            const items: GameItem[] = []
            for (const row of data.items ?? []) {
                const it = normalizeGameItem(row)
                if (it) items.push(it)
            }
            const total = typeof data.total === 'number' ? data.total : items.length
            const hasMore = Boolean(data.next)
            return {
                items,
                total,
                offset: typeof data.offset === 'number' ? data.offset : offset,
                limit: typeof data.limit === 'number' ? data.limit : limit,
                hasMore,
            }
        })
    }

    async getItemById(id: string): Promise<GameItem | null> {
        const trimmed = id.trim()
        if (!trimmed) return null
        const path = `/v1/items/${encodeURIComponent(trimmed)}`
        return withGameDataCache(`mahcks:v1:item:${encodeURIComponent(trimmed)}`, TTL_SINGLE_ITEM_MS, async () => {
            try {
                const raw = await fetchUpstreamJson<unknown>(url(path), { revalidateSeconds: 600 })
                return normalizeGameItem(raw)
            } catch (e) {
                if (e instanceof UpstreamGameDataError && e.status === 404) return null
                throw e
            }
        })
    }
}
