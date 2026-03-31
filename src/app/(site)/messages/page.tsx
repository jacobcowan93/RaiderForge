'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import type { ConversationRow } from '@/lib/messages/messages-api'
import { startConversation, startOrderConversation, fetchConversations } from '@/lib/messages/messages-api'
import { MessagesLayout } from './_components/MessagesLayout'

type MobileView = 'list' | 'thread'

export default function MessagesPage() {
    const { data: session, status } = useSession()
    const searchParams = useSearchParams()
    const router = useRouter()

    const [conversations, setConversations] = useState<ConversationRow[]>([])
    const [activeId, setActiveId] = useState<string | null>(null)
    const [mobileView, setMobileView] = useState<MobileView>('list')
    const [bootstrapping, setBootstrapping] = useState(true)

    // Load conversations + handle ?with= and ?order= params
    useEffect(() => {
        if (status !== 'authenticated') return

        async function bootstrap() {
            setBootstrapping(true)

            const withUser = searchParams.get('with')
            const orderId = searchParams.get('order')

            if (withUser) {
                const r = await startConversation(withUser)
                if (r.ok) {
                    setActiveId(r.conversation.id)
                    setMobileView('thread')
                    setConversations((prev) => {
                        const exists = prev.find((c) => c.id === r.conversation.id)
                        return exists ? prev : [r.conversation, ...prev]
                    })
                }
                router.replace('/messages', { scroll: false })
            } else if (orderId) {
                const r = await startOrderConversation(orderId)
                if (r.ok) {
                    setActiveId(r.conversation.id)
                    setMobileView('thread')
                    setConversations((prev) => {
                        const exists = prev.find((c) => c.id === r.conversation.id)
                        return exists ? prev : [r.conversation, ...prev]
                    })
                }
                router.replace('/messages', { scroll: false })
            }

            const cr = await fetchConversations()
            if (cr.ok) setConversations(cr.conversations)

            setBootstrapping(false)
        }

        bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    function handleSelect(id: string) {
        setActiveId(id)
        setMobileView('thread')
    }

    function handleBack() {
        setMobileView('list')
    }

    function handleMessageSent() {
        // Refresh conversation list so last message updates
        fetchConversations().then((r) => { if (r.ok) setConversations(r.conversations) })
    }

    if (status === 'loading' || bootstrapping) {
        return (
            <div className="flex items-center justify-center h-[calc(100dvh-52px)]">
                <div className="w-6 h-6 rounded-full border-2 border-yellow-400/40 border-t-yellow-400 animate-spin" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100dvh-52px)] gap-4 text-center px-4">
                <p className="text-sm text-white/50">Sign in to view your messages.</p>
            </div>
        )
    }

    const currentUserId = session!.user!.id!

    return (
        <MessagesLayout
            conversations={conversations}
            setConversations={setConversations}
            activeId={activeId}
            currentUserId={currentUserId}
            mobileView={mobileView}
            onSelectConversation={handleSelect}
            onBack={handleBack}
            onMessageSent={handleMessageSent}
        />
    )
}
