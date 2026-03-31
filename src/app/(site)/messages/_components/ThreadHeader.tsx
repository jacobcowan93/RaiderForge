import type { ConversationRow } from '@/lib/messages/messages-api'

export function ThreadHeader({
    conversation,
    onBack,
}: {
    conversation: ConversationRow
    onBack?: () => void
}) {
    const u = conversation.otherUser
    const initials = (u.name ?? '?').slice(0, 2).toUpperCase()

    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] min-h-[56px]">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 -ml-1 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors md:hidden"
                    aria-label="Back to conversation list"
                >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
            )}
            {u.image ? (
                <img src={u.image} alt="" className="h-8 w-8 rounded-full ring-1 ring-white/20 shrink-0" aria-hidden />
            ) : (
                <div className="h-8 w-8 rounded-full bg-rf-red/20 flex items-center justify-center text-xs font-bold text-rf-red shrink-0">
                    {initials}
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{u.name ?? 'Unknown user'}</p>
                {conversation.orderId && (
                    <p className="text-[10px] text-white/40 truncate">Order thread</p>
                )}
            </div>
        </div>
    )
}
