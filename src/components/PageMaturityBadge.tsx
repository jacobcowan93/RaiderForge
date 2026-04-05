import type { MaturityLevel } from '@/lib/site/maturity'

const styles: Record<MaturityLevel, string> = {
    live: 'border-emerald-400/50 bg-emerald-500/12 text-emerald-300',
    beta: 'border-amber-400/45 bg-amber-500/10 text-amber-200/95',
    'in-development': 'border-white/15 bg-white/[0.05] text-white/50',
}

const glowStyles: Record<MaturityLevel, string | undefined> = {
    live: '0 0 8px rgba(52,211,153,0.45), 0 0 20px rgba(52,211,153,0.20)',
    beta: '0 0 8px rgba(251,191,36,0.35), 0 0 16px rgba(251,191,36,0.15)',
    'in-development': undefined,
}

const labels: Record<MaturityLevel, string> = {
    live: 'Live',
    beta: 'Beta',
    'in-development': 'In development',
}

export function PageMaturityBadge({
    level,
    className = '',
}: {
    level: MaturityLevel
    className?: string
}) {
    const glow = glowStyles[level]

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[level]} ${className}`}
            style={glow ? { boxShadow: glow } : undefined}
        >
            {level === 'live' && (
                <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
                    style={{ boxShadow: '0 0 4px rgba(52,211,153,0.80)' }}
                    aria-hidden="true"
                />
            )}
            {level === 'beta' && (
                <span
                    className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shrink-0"
                    aria-hidden="true"
                />
            )}
            {labels[level]}
        </span>
    )
}
