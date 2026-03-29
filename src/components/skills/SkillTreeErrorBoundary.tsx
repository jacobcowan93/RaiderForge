'use client'

import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'

type Props = {
    children: ReactNode
}

type State = { hasError: boolean; message: string; resetKey: number }

/**
 * Catches runtime errors inside the skill tree client subtree so the rest of the page
 * (header, footer) still renders. Next.js `error.tsx` is route-level; this is scoped to the planner.
 *
 * **Try again:** increments `resetKey` so React remounts `children` — required because merely
 * clearing `hasError` would leave a broken subtree mounted (same error would throw again on render).
 */
export class SkillTreeErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, message: '', resetKey: 0 }
    }

    static getDerivedStateFromError(err: Error): Partial<State> {
        return { hasError: true, message: err.message || 'Something went wrong' }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[SkillTreeErrorBoundary]', error, info.componentStack)
        }
    }

    private handleRetry = () => {
        this.setState((s) => ({
            hasError: false,
            message: '',
            resetKey: s.resetKey + 1,
        }))
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="rounded-2xl border border-amber-500/35 bg-amber-950/25 px-5 py-6 text-center"
                >
                    <p className="text-sm font-semibold text-amber-200">Something went wrong in the Skill Tree Planner</p>
                    <p className="mt-2 text-xs text-white/55 max-w-md mx-auto leading-relaxed">
                        {this.state.message}
                    </p>
                    <p className="mt-3 text-[11px] text-white/35 max-w-md mx-auto">
                        Your progress may still be saved in this browser. You can try reloading the planner below.
                    </p>
                    <button
                        type="button"
                        className="mt-4 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
                        onClick={this.handleRetry}
                    >
                        Try again
                    </button>
                </div>
            )
        }
        return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>
    }
}
