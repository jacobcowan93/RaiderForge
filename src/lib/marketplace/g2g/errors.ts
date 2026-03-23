export class G2GConfigError extends Error {
    readonly name = 'G2GConfigError'
    readonly missing: readonly string[]

    constructor(missing: string[]) {
        super(`G2G configuration incomplete: missing ${missing.join(', ')}`)
        this.missing = missing
    }
}

export class G2GResponseError extends Error {
    readonly name = 'G2GResponseError'
    readonly status: number
    readonly requestId?: string
    readonly code?: string
    readonly bodySnippet: string

    constructor(
        message: string,
        opts: { status: number; requestId?: string; code?: string; bodySnippet: string }
    ) {
        super(message)
        this.status = opts.status
        this.requestId = opts.requestId
        this.code = opts.code
        this.bodySnippet = opts.bodySnippet
    }
}

export class G2GParseError extends Error {
    readonly name = 'G2GParseError'
    constructor(message: string, readonly cause?: unknown) {
        super(message)
    }
}
