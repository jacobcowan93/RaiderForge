import 'server-only'

import { createRequestPacer } from './rate-limit'
import { tryLoadG2GServerConfig } from './env'
import { G2GParseError, G2GResponseError } from './errors'
import { signG2GRequest } from './sign'
import type { G2GApiEnvelope, G2GRequestInit } from './types'

const REDACT = '[redacted]'

function snippet(text: string, max = 512): string {
    const t = text.replace(/\s+/g, ' ').trim()
    return t.length <= max ? t : `${t.slice(0, max)}…`
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function looksLikeEnvelope(v: unknown): v is G2GApiEnvelope {
    if (!isRecord(v)) return false
    const codeOk = typeof v.code === 'string' || typeof v.code === 'number'
    return (
        typeof v.request_id === 'string' &&
        codeOk &&
        typeof v.message === 'string' &&
        typeof v.warning === 'string' &&
        'payload' in v
    )
}

export type G2GApiClient = {
    readonly config: NonNullable<ReturnType<typeof tryLoadG2GServerConfig>>
    request: <TPayload = unknown>(init: G2GRequestInit) => Promise<G2GApiEnvelope<TPayload>>
}

/**
 * Server-only HTTP client: signing (Verifying Signatures), rate limiting, JSON handling, envelope checks.
 */
export function createG2GApiClient(): G2GApiClient | null {
    const config = tryLoadG2GServerConfig()
    if (!config) return null

    const pace = createRequestPacer(config.minRequestIntervalMs)

    return {
        config,
        request: <TPayload = unknown>(init: G2GRequestInit) =>
            pace(async () => {
                const method = init.method ?? 'GET'
                const path = init.path.startsWith('/') ? init.path : `/${init.path}`
                const url = `${config.apiBaseUrl}${path}`

                const headers: Record<string, string> = {
                    ...init.headers
                }

                let bodyStr: string | undefined
                if (init.body !== undefined) {
                    bodyStr = JSON.stringify(init.body)
                    if (!headers['Content-Type'] && !headers['content-type']) {
                        headers['Content-Type'] = 'application/json'
                    }
                }

                const timestamp = Date.now()
                const signature = signG2GRequest(path, method, timestamp, config)
                headers['g2g-api-key'] = config.accessKeyId
                headers['g2g-userid'] = config.userId
                headers['g2g-timestamp'] = String(timestamp)
                headers['g2g-signature'] = signature

                if (process.env.NODE_ENV === 'development') {
                    console.info('[G2G] →', method, url, bodyStr ? `{ body: ${snippet(bodyStr)} }` : '')
                }

                const res = await fetch(url, { method, headers, body: bodyStr })

                const text = await res.text()
                let json: unknown
                try {
                    json = text ? JSON.parse(text) : null
                } catch (e) {
                    throw new G2GParseError('G2G response was not valid JSON', e)
                }

                if (!res.ok) {
                    const rid = isRecord(json) && typeof json.request_id === 'string' ? json.request_id : undefined
                    const code = isRecord(json) && typeof json.code === 'string' ? json.code : undefined
                    throw new G2GResponseError(`G2G HTTP ${res.status}`, {
                        status: res.status,
                        requestId: rid,
                        code,
                        bodySnippet: snippet(text)
                    })
                }

                if (!looksLikeEnvelope(json)) {
                    throw new G2GParseError('G2G JSON missing expected envelope fields (request_id, code, message, warning, payload)')
                }

                const env = json as G2GApiEnvelope<TPayload>
                return { ...env, code: String(env.code) }
            })
    }
}

export function safeG2GLogContext(err: unknown): Record<string, string | number | undefined> {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'G2GResponseError') {
        const e = err as G2GResponseError
        return {
            name: e.name,
            status: e.status,
            requestId: e.requestId,
            code: e.code,
            bodySnippet: snippet(e.bodySnippet.replace(/[A-Za-z0-9+/]{20,}/g, REDACT))
        }
    }
    if (err && typeof err === 'object' && 'name' in err && err.name === 'G2GParseError') {
        return { name: 'G2GParseError' }
    }
    return { name: 'Error' }
}
