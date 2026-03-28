import type { ReactNode } from 'react'

export function LegalPageShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-rf-bg text-rf-text px-4 py-12">
            <div className="mx-auto max-w-4xl space-y-8">{children}</div>
        </div>
    )
}
