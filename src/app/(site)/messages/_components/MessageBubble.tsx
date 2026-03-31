import type { MessageRow } from '@/lib/messages/messages-api'

function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
    if (diffDays < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MessageBubble({
    message,
    isSelf,
    isPending,
}: {
    message: MessageRow
    isSelf: boolean
    isPending?: boolean
}) {
    return (
        <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isSelf
                            ? 'bg-yellow-400/90 text-black rounded-br-sm'
                            : 'bg-white/[0.08] text-white/90 rounded-bl-sm'
                    } ${isPending ? 'opacity-60' : ''}`}
                >
                    {message.body}
                </div>
                <span className="text-[9px] text-white/30 px-1">
                    {isPending ? 'Sending…' : formatTime(message.createdAt)}
                </span>
            </div>
        </div>
    )
}
