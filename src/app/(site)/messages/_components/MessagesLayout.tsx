'use client'

import type { ConversationRow } from '@/lib/messages/messages-api'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'
import { EmptyThreadPlaceholder } from './EmptyThreadPlaceholder'

type MobileView = 'list' | 'thread'

export function MessagesLayout({
    conversations,
    setConversations,
    activeId,
    currentUserId,
    mobileView,
    onSelectConversation,
    onBack,
    onMessageSent,
}: {
    conversations: ConversationRow[]
    setConversations: (c: ConversationRow[]) => void
    activeId: string | null
    currentUserId: string
    mobileView: MobileView
    onSelectConversation: (id: string) => void
    onBack: () => void
    onMessageSent: () => void
}) {
    return (
        <div className="flex h-[calc(100dvh-52px)] overflow-hidden">
            {/* ── Left panel: Conversation list ── */}
            <aside
                className={`
                    w-full md:w-[300px] lg:w-[320px] shrink-0
                    border-r border-white/[0.07] overflow-y-auto
                    flex flex-col
                    ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}
                `}
            >
                <div className="px-4 py-3 border-b border-white/[0.07]">
                    <h2 className="text-sm font-semibold text-white/80">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList
                        conversations={conversations}
                        setConversations={setConversations}
                        activeId={activeId}
                        currentUserId={currentUserId}
                        onSelect={onSelectConversation}
                    />
                </div>
            </aside>

            {/* ── Right panel: Thread ── */}
            <main
                className={`
                    flex-1 flex flex-col overflow-hidden min-w-0
                    ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
                `}
            >
                {activeId ? (
                    <MessageThread
                        key={activeId}
                        conversationId={activeId}
                        currentUserId={currentUserId}
                        onBack={onBack}
                        onMessageSent={onMessageSent}
                    />
                ) : (
                    <div className="hidden md:flex flex-1">
                        <EmptyThreadPlaceholder />
                    </div>
                )}
            </main>
        </div>
    )
}
