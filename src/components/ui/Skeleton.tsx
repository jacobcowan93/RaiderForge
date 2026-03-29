import type { HTMLAttributes } from 'react'

const pulse = 'animate-pulse bg-white/[0.06]'

type SkeletonLineProps = HTMLAttributes<HTMLSpanElement> & { className?: string }

/** Thin horizontal bar placeholder. */
export function SkeletonLine({ className = '', ...rest }: SkeletonLineProps) {
    return (
        <span
            className={`block rounded ${pulse} ${className}`}
            aria-hidden
            {...rest}
        />
    )
}

type SkeletonBlockProps = HTMLAttributes<HTMLDivElement> & { className?: string }

/** Rectangular block placeholder. */
export function SkeletonBlock({ className = '', ...rest }: SkeletonBlockProps) {
    return <div className={`rounded ${pulse} ${className}`} aria-hidden {...rest} />
}

type PageSectionSkeletonProps = {
    /** `compact` = shorter shell for root `loading.tsx`. */
    variant?: 'full' | 'compact'
}

/**
 * Default pending UI shell aligned with typical `(site)` pages: title bars + content blocks.
 */
export function PageSectionSkeleton({ variant = 'full' }: PageSectionSkeletonProps) {
    if (variant === 'compact') {
        return (
            <div
                className="mx-auto max-w-7xl px-4 sm:px-6 py-8"
                role="status"
                aria-busy="true"
                aria-label="Loading"
            >
                <SkeletonLine className="h-7 w-40 max-w-full" />
                <SkeletonLine className="mt-3 h-4 w-64 max-w-full opacity-80" />
                <SkeletonBlock className="mt-8 h-56 w-full rounded-xl border border-white/[0.04]" />
            </div>
        )
    }

    return (
        <div
            className="mx-auto max-w-7xl px-4 sm:px-6 py-8"
            role="status"
            aria-busy="true"
            aria-label="Loading"
        >
            <SkeletonLine className="h-9 w-56 max-w-full" />
            <SkeletonLine className="mt-3 h-4 w-80 max-w-full opacity-80" />
            <SkeletonLine className="mt-2 h-4 w-2/3 max-w-md opacity-60" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <SkeletonBlock className="h-44 rounded-xl border border-white/[0.04]" />
                <SkeletonBlock className="h-44 rounded-xl border border-white/[0.04]" />
            </div>
            <SkeletonBlock className="mt-4 h-32 w-full rounded-xl border border-white/[0.04]" />
        </div>
    )
}

/** Suspense fallback for the skill tree planner (three-column grid). */
export function PlannerSkeleton() {
    return (
        <div
            className="grid min-h-[min(60vh,520px)] lg:grid-cols-3 gap-4"
            role="status"
            aria-busy="true"
            aria-label="Loading skill tree planner"
        >
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-white/[0.05] p-4 bg-[rgba(15,20,27,0.55)]"
                    style={{ aspectRatio: '3/4.5' }}
                >
                    <SkeletonLine className="h-3 w-1/2 mb-2" />
                    <SkeletonLine className="h-2 w-2/3 mb-4 opacity-70" />
                    <div className="h-full min-h-[200px] rounded-xl bg-white/[0.03] animate-pulse" />
                </div>
            ))}
        </div>
    )
}
