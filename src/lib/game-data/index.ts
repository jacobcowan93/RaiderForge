/**
 * Public entry for server-side game data access.
 * Prefer HTTP `/api/game/*` from the browser; import from here in Server Components / route handlers only.
 */
export type {
    GameDataPage,
    GameItem,
    GameMap,
    GameMapEvent,
    GameMapEventsBundle,
    GameProject,
    GameQuest,
    GameSkillNode,
} from './types'
export { getGameDataProvider, type GameDataProvider } from './provider'
export { clearGameDataCache } from './cache'
export { UpstreamGameDataError } from './fetchUpstream'
