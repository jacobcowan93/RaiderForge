/**
 * Documented envelope shape (see G2G schemas: request_id, code, message, warning).
 * Per-endpoint `payload` typing lands in later phases alongside each OpenAPI operation.
 */
export type G2GApiEnvelope<TPayload = unknown> = {
    request_id: string
    code: string
    message: string
    warning: string
    payload: TPayload
}

export type G2GRequestInit = {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    /** Path beginning with `/`, e.g. `/v2/...` (see Migrate To V2). Signed without query string. */
    path: string
    /** URL query parameters (GET). Omitted keys are not sent. */
    query?: Record<string, string | undefined>
    /** Serialized JSON body for POST/PATCH/DELETE when applicable. */
    body?: unknown
    /** Optional override; default `application/json` when body is set. */
    headers?: Record<string, string>
}
