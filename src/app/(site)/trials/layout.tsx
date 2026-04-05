import type { ReactNode } from 'react'

export default function TrialsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative">
            {/* Yellow category accent — Weekly Trials identity */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-[3px] bg-gradient-to-r from-transparent via-yellow-500/70 to-transparent" aria-hidden />
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(202,138,4,0.07)_0%,transparent_100%)]" aria-hidden />
            {children}
        </div>
    )
}
