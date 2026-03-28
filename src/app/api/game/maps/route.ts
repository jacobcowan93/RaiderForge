import { withGameDataProvider } from '@/lib/game-data/routeHelpers'

export const dynamic = 'force-dynamic'

export async function GET() {
    return withGameDataProvider(async (provider) => ({
        maps: await provider.getMaps(),
    }))
}
