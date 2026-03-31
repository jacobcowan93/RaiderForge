'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ConversationRow, MessageRow } from '@/lib/messages/messages-api'
import { fetchMessages, sendMessage, markConversationRead } from '@/lib/messages/messages-api'
import { MessageBubble } from './MessageBubble'
import { SendForm } from './SendForm'
import { ThreadHeader } from './ThreadHeader'

export function MessageThread({
    conversationId,
    currentUserId,
    onBack,
    onMessageSent,
}: {
    conversationId: string
    currentUserId: string
    onBack?: () => void
    onMessageSent?: () => void
}) {
    const [messages, setMessages] = useState<MessageRow[]>([])
    const [conversation, setConversation] = useState<ConversationRow | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const hasScrolledRef = useRef(false)

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        const r = await fetchMessages(conversationId)
        if (!silent) setLoading(false)
        if (!r.ok) {
            setError('message' in r ? (r.message ?? 'Failed to load messages.') : 'Failed to load messages.')
            return
        }
        setMessages(r.messages)
        setConversation(r.conversation)
        setError(null)
    }, [conversationId])

    // Initial load + mark read
    useEffect(() => {
        hasScrolledRef.current = false
        load()
        markConversationRead(conversationId)
    }, [conversationId, load])

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages.length === 0) return
        if (!hasScrolledRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' })
            hasScrolledRef.current = true
        } else {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages.length])

    // Poll every 12s
    useEffect(() => {
        const id = setInterval(() => load(true), 12_000)
        return () => clearInterval(id)
    }, [load])

    async function handleSend(body: string) {
        // Optimistic
        const pending: MessageRow = {
            id: `pending-${Date.now()}`,
            senderId: currentUserId,
            body,
            readAt: null,
            createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, pending])

        const r = await sendMessage(conversationId, body)
        if (r.ok) {
            setMessages((prev) => prev.map((m) => (m.id === pending.id ? r.message : m)))
            onMessageSent?.()
        } else {
            setMessages((prev) => prev.filter((m) => m.id !== pending.id))
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-yellow-400/40 border-t-yellow-400 animate-spin" />
            </div>
        )
    }

    if (error || !conversation) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-white/40">{error ?? 'Conversation not found.'}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <ThreadHeader conversation={conversation} onBack={onBack} />

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-white/30">No messages yet. Say hello!</p>
                    </div>
                )}
                {messages.map((m) => (
                    <MessageBubble
                        key={m.id}
                        message={m}
                        isSelf={m.senderId === currentUserId}
                        isPending={m.id.startsWith('pending-')}
                    />
                ))}
                <div ref={bottomRef} />
            </div>

            <SendForm onSend={handleSend} />
        </div>
    )
}
