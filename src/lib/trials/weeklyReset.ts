/**
 * Next UTC Monday 00:00 after `now` — stand-in for weekly playlist refresh until an official Trials API exists.
 */
export function getNextUtcMondayMidnightMs(now: Date = new Date()): number {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
    while (next.getUTCDay() !== 1) {
        next.setUTCDate(next.getUTCDate() + 1)
    }
    if (next.getTime() <= now.getTime()) {
        next.setUTCDate(next.getUTCDate() + 7)
    }
    return next.getTime()
}
