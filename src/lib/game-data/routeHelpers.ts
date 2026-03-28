import { NextResponse } from 'next/server'
import type { GameDataProvider } from './provider'
import { getGameDataProvider } from './provider'

export async function withGameDataProvider<T>(
    handler: (provider: GameDataProvider) => Promise<T>
): Promise<NextResponse> {
    try {
        const provider = getGameDataProvider()
        const data = await handler(provider)
        return NextResponse.json({
            ok: true,
            meta: { provider: provider.id, fetchedAt: new Date().toISOString() },
            data: data ?? null,
        })
    } catch (e) {
        console.error('[api/game]', e)
        return NextResponse.json(
            { ok: false, error: e instanceof Error ? e.message : 'Game data error' },
            { status: 502 }
        )
    }
}
