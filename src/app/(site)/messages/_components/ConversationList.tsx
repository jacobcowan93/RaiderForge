'use client'

import { useEffect, useCallback } from 'react'
import type { ConversationRow } from '@/lib/messages/messages-api'
import { fetchConversations } from '@/lib/messages/messages-api'
import { ConversationItem } from './ConversationItem'

export function ConversationList({
    conversations,
    setConversations,
    activeId,
    currentUserId,
    onSelect,
}: {
    conversations: ConversationRow[]
    setConversations: (c: ConversationRow[]) => void
    activeId: string | null
    currentUserId: string
    onSelect: (id: string) => void
}) {
    const load = useCallback(async (silent = false) => {
        const r = await fetchConversations()
        if (r.ok) setConversations(r.conversations)
    }, [setConversations])

    useEffect(() => {
        load()
    }, [load])

    // Poll every 15s
    useEffect(() => {
        const id = setInterval(() => load(true), 15_000)
        return () => clearInterval(id)
    }, [load])

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white/30" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-medium text-white/50">No conversations yet</p>
                    <p className="text-xs text-white/25 mt-1">Start one from an order or marketplace listing.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="py-1 space-y-0.5 px-1">
            {conversations.map((c) => (
                <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={c.id === activeId}
                    currentUserId={currentUserId}
                    onClick={() => onSelect(c.id)}
                />
            ))}
        </div>
    )
}
