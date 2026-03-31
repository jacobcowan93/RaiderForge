'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
    startOrderConversation,
    fetchMessages,
    sendMessage,
    markConversationRead,
    type MessageRow,
    type ConversationRow,
} from '@/lib/messages/messages-api'

function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function OrderMessageThread({
    orderId,
    currentUserId,
}: {
    orderId: string
    currentUserId: string
}) {
    const [conversation, setConversation] = useState<ConversationRow | null>(null)
    const [messages, setMessages] = useState<MessageRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Bootstrap: get-or-create the order thread
    useEffect(() => {
        let cancelled = false
        async function init() {
            setLoading(true)
            const r = await startOrderConversation(orderId)
            if (cancelled) return
            if (!r.ok) { setError('message' in r ? r.message ?? 'Could not load thread.' : 'Could not load thread.'); setLoading(false); return }
            setConversation(r.conversation)
            await loadMessages(r.conversation.id, false, cancelled)
            await markConversationRead(r.conversation.id)
            setLoading(false)
        }
        init()
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId])

    async function loadMessages(convId: string, silent: boolean, cancelled?: boolean) {
        const r = await fetchMessages(convId)
        if (cancelled) return
        if (r.ok) setMessages(r.messages)
    }

    // Poll for new messages
    useEffect(() => {
        if (!conversation) return
        const convId = conversation.id
        const id = setInterval(() => loadMessages(convId, true), 15_000)
        return () => clearInterval(id)
    }, [conversation?.id])

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    async function handleSend() {
        if (!conversation || !text.trim() || sending) return
        const body = text.trim()
        setSending(true)
        setText('')
        const pending: MessageRow = {
            id: `pending-${Date.now()}`,
            senderId: currentUserId,
            body,
            readAt: null,
            createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, pending])
        const r = await sendMessage(conversation.id, body)
        if (r.ok) {
            setMessages((prev) => prev.map((m) => (m.id === pending.id ? r.message : m)))
        } else {
            setMessages((prev) => prev.filter((m) => m.id !== pending.id))
        }
        setSending(false)
        inputRef.current?.focus()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <div className="w-4 h-4 rounded-full border-2 border-yellow-400/40 border-t-yellow-400 animate-spin" />
            </div>
        )
    }

    if (error) {
        return <p className="text-xs text-white/40 text-center py-4">{error}</p>
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Message list */}
            <div className="max-h-72 overflow-y-auto flex flex-col gap-2 px-1 py-1">
                {messages.length === 0 && (
                    <p className="text-xs text-white/30 text-center py-4">No messages yet. Start the conversation!</p>
                )}
                {messages.map((m) => {
                    const isSelf = m.senderId === currentUserId
                    const isPending = m.id.startsWith('pending-')
                    return (
                        <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] flex flex-col gap-0.5 ${isSelf ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
                                        isSelf
                                            ? 'bg-yellow-400/85 text-black rounded-br-sm'
                                            : 'bg-white/[0.08] text-white/85 rounded-bl-sm'
                                    } ${isPending ? 'opacity-60' : ''}`}
                                >
                                    {m.body}
                                </div>
                                <span className="text-[9px] text-white/25 px-1">
                                    {isPending ? 'Sending…' : formatTime(m.createdAt)}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Send form */}
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                    placeholder="Type a message…"
                    maxLength={2000}
                    disabled={sending}
                    className="flex-1 rounded-lg bg-white/[0.06] border border-white/[0.10] text-xs text-white/85 placeholder:text-white/30 px-3 py-2 focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="shrink-0 h-8 w-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Send"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
