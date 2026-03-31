/**
 * Game data provider abstraction for RaiderForge.
 *
 * UI and most features should call `/api/game/*` or use `getGameDataProvider()` only on the server.
 * Swap `GAME_DATA_PROVIDER` + add a new implementation file when replacing upstream (e.g. official Embark API).
 */

import type {
    GameDataPage,
    GameItem,
    GameMap,
    GameMapEventsBundle,
    GameProject,
    GameQuest,
    GameSkillNode,
    GameTrade,
} from './types'
import { MahcksGameDataProvider } from './providers/mahcks'

export type GameDataProvider = {
    readonly id: string
    getMaps(): Promise<GameMap[]>
    getProjects(): Promise<GameProject[]>
    getSkillNodes(): Promise<GameSkillNode[]>
    getMapEventsBundle(): Promise<GameMapEventsBundle>
    /** All quests (provider fetches individually from upstream). */
    getQuests(): Promise<GameQuest[]>
    /** All trader barter entries. */
    getTrades(): Promise<GameTrade[]>
    getItemsPage(params: { limit: number; offset: number }): Promise<GameDataPage<GameItem>>
    /** Single item by upstream id, or null if missing. */
    getItemById(id: string): Promise<GameItem | null>
}

export function getGameDataProvider(): GameDataProvider {
    const id = (process.env.GAME_DATA_PROVIDER ?? 'mahcks').trim().toLowerCase()
    if (id === 'mahcks') {
        return new MahcksGameDataProvider()
    }
    throw new Error(
        `[game-data] Unknown GAME_DATA_PROVIDER "${id}". Set GAME_DATA_PROVIDER=mahcks or register a new provider in provider.ts.`
    )
}
