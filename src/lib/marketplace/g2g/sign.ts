import 'server-only'

import { createHmac } from 'node:crypto'

import type { G2GServerConfig } from './env'
import type { G2GRequestInit } from './types'

type G2GSignMethod = NonNullable<G2GRequestInit['method']>

/**
 * g2g-signature: HMAC-SHA256(secret, canonical_string) as lowercase hex.
 * Per G2G “Verifying Signatures” / Authentication Intro, canonical_string is built from
 * API path, access key (api key id), user id, and timestamp — matching the official
 * Postman pre-request script (g2g-official/open-api-sample):
 *   canonical_string = url_path + api_key + user_id + String(timestamp)
 * HTTP method is not included in the signing input.
 */
export function signG2GRequest(
    path: string,
    method: G2GSignMethod,
    timestamp: number,
    config: Pick<G2GServerConfig, 'accessKeyId' | 'secretAccessKey' | 'userId'>
): string {
    void method
    const urlPath = path.startsWith('/') ? path : `/${path}`
    const canonicalString = `${urlPath}${config.accessKeyId}${config.userId}${String(timestamp)}`
    return createHmac('sha256', config.secretAccessKey).update(canonicalString, 'utf8').digest('hex')
}
