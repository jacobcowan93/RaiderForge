import type { MaturityLevel } from '@/lib/site/maturity'

const styles: Record<MaturityLevel, string> = {
    live: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300/95',
    beta: 'border-amber-500/35 bg-amber-500/10 text-amber-200/90',
    'in-development': 'border-white/15 bg-white/[0.06] text-white/55',
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
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[level]} ${className}`}
        >
            {labels[level]}
        </span>
    )
}
