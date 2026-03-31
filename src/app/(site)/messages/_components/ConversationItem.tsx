import type { ConversationRow } from '@/lib/messages/messages-api'

function formatRelative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ConversationItem({
    conversation,
    isActive,
    currentUserId,
    onClick,
}: {
    conversation: ConversationRow
    isActive: boolean
    currentUserId: string
    onClick: () => void
}) {
    const u = conversation.otherUser
    const initials = (u.name ?? '?').slice(0, 2).toUpperCase()
    const last = conversation.lastMessage
    const isMine = last?.senderId === currentUserId
    const preview = last ? (isMine ? `You: ${last.body}` : last.body) : 'No messages yet'
    const hasUnread = conversation.unreadCount > 0

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                isActive
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/75 hover:bg-white/[0.05] hover:text-white'
            }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                {u.image ? (
                    <img src={u.image} alt="" className="h-9 w-9 rounded-full ring-1 ring-white/20" aria-hidden />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-rf-red/20 flex items-center justify-center text-xs font-bold text-rf-red">
                        {initials}
                    </div>
                )}
                {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-yellow-400 ring-2 ring-rf-bg" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                    <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
                        {u.name ?? 'Unknown user'}
                    </p>
                    {last && (
                        <span className="text-[9px] text-white/30 shrink-0">{formatRelative(last.createdAt)}</span>
                    )}
                </div>
                <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-white/70' : 'text-white/35'}`}>
                    {preview.length > 60 ? preview.slice(0, 60) + '…' : preview}
                </p>
            </div>

            {conversation.unreadCount > 0 && (
                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-400 text-black text-[9px] font-bold leading-[18px] text-center">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </span>
            )}
        </button>
    )
}
