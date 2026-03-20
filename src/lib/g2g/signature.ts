/**
 * signG2GRequest
 *
 * Skeleton for creating a G2G HMAC-SHA256 signature. Follow G2G's "Message Signature" spec
 * when implementing. This file intentionally returns a placeholder until real signing is needed.
 *
 * FUTURE: implement HMAC-SHA256 using Node's `crypto` module on the server.
 */
export function signG2GRequest(params: {
    path: string
    apiKey: string
    userId: string
    timestamp: string
    secret: string
}): string {
    // TODO: implement HMAC-SHA256 according to G2G docs
    return 'TODO_SIGNATURE'
}
