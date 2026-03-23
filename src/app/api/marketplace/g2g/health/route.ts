import { NextResponse } from 'next/server'
import { createG2GApiClient, safeG2GLogContext } from '@/lib/marketplace/g2g/client'
import { G2GResponseError } from '@/lib/marketplace/g2g/errors'
import { getMissingG2GConfigKeys } from '@/lib/marketplace/g2g/env'

export async function GET() {
    const missing = getMissingG2GConfigKeys()
    if (missing.length > 0) {
        return NextResponse.json({
            g2g: {
                configured: false,
                missingKeys: missing
            }
        })
    }

    const client = createG2GApiClient()
    if (!client) {
        return NextResponse.json({
            g2g: {
                configured: false,
                missingKeys: missing
            }
        })
    }

    try {
        const res = await client.request({ method: 'GET', path: '/v2/store' })
        return NextResponse.json({
            g2g: {
                configured: true,
                api: { ok: true, code: String(res.code) }
            }
        })
    } catch (e) {
        if (e instanceof G2GResponseError) {
            return NextResponse.json({
                g2g: {
                    configured: true,
                    api: { ok: false, status: e.status }
                }
            })
        }
        if (process.env.NODE_ENV === 'development') {
            console.warn('[G2G] health check failed', safeG2GLogContext(e))
        }
        return NextResponse.json({
            g2g: {
                configured: true,
                api: { ok: false, error: 'request_failed' }
            }
        })
    }
}
