import { withGameDataProvider } from '@/lib/game-data/routeHelpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    return withGameDataProvider(async (provider) => ({
        quests: await provider.getQuests(),
    }))
}
