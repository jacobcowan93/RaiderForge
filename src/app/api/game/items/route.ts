import type { NextRequest } from 'next/server'
import { withGameDataProvider } from '@/lib/game-data/routeHelpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id')?.trim()
    if (id) {
        return withGameDataProvider(async (provider) => ({
            item: await provider.getItemById(id),
        }))
    }

    const limitRaw = Number(req.nextUrl.searchParams.get('limit'))
    const offsetRaw = Number(req.nextUrl.searchParams.get('offset'))
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(90, Math.floor(limitRaw)) : 45
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

    return withGameDataProvider((provider) => provider.getItemsPage({ limit, offset }))
}
