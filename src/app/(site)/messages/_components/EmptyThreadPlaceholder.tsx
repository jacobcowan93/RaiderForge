export function EmptyThreadPlaceholder() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.2} stroke="currentColor" className="w-8 h-8 text-white/20" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
            </div>
            <div>
                <p className="text-sm font-medium text-white/35">Select a conversation</p>
                <p className="text-xs text-white/20 mt-1 leading-relaxed max-w-xs">
                    Choose a thread from the list, or open a conversation from a marketplace order.
                </p>
            </div>
        </div>
    )
}
