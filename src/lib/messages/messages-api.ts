/**
 * Browser-side fetch helpers for RaiderForge messaging.
 */

const BASE = '/api/messages'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OtherUser = {
    id: string
    name: string | null
    image: string | null
}

export type ConversationRow = {
    id: string
    otherUser: OtherUser
    lastMessage: {
        body: string
        createdAt: string
        senderId: string
    } | null
    unreadCount: number
    orderId: string | null
    updatedAt: string
    createdAt: string
}

export type MessageRow = {
    id: string
    senderId: string
    body: string
    readAt: string | null
    createdAt: string
}

export type MessagesError = { ok: false; error: string; message?: string; status?: number }

async function parseError(res: Response): Promise<MessagesError> {
    let json: unknown
    try { json = await res.json() } catch { /* ignore */ }
    const e = json as { error?: string; message?: string } | undefined
    return { ok: false, error: e?.error ?? 'request_failed', message: e?.message, status: res.status }
}

// ─── Unread count (lightweight, for navbar badge) ─────────────────────────────

export type UnreadCountResult = { ok: true; count: number } | MessagesError

export async function fetchUnreadCount(): Promise<UnreadCountResult> {
    const res = await fetch(`${BASE}/unread`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { count: number }
    return { ok: true, count: json.count ?? 0 }
}

// ─── Conversations list ───────────────────────────────────────────────────────

export type FetchConversationsResult = { ok: true; conversations: ConversationRow[] } | MessagesError

export async function fetchConversations(): Promise<FetchConversationsResult> {
    const res = await fetch(`${BASE}/conversations`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { conversations: ConversationRow[] }
    return { ok: true, conversations: json.conversations ?? [] }
}

// ─── Messages in a thread ─────────────────────────────────────────────────────

export type FetchMessagesResult = {
    ok: true
    messages: MessageRow[]
    conversation: ConversationRow
} | MessagesError

export async function fetchMessages(conversationId: string): Promise<FetchMessagesResult> {
    const res = await fetch(`${BASE}/conversations/${encodeURIComponent(conversationId)}`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { messages: MessageRow[]; conversation: ConversationRow }
    return { ok: true, messages: json.messages ?? [], conversation: json.conversation }
}

// ─── Send message ─────────────────────────────────────────────────────────────

export type SendMessageResult = { ok: true; message: MessageRow } | MessagesError

export async function sendMessage(conversationId: string, body: string): Promise<SendMessageResult> {
    const res = await fetch(`${BASE}/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { message: MessageRow }
    return { ok: true, message: json.message }
}

// ─── Mark conversation as read ────────────────────────────────────────────────

export type MarkReadResult = { ok: true } | MessagesError

export async function markConversationRead(conversationId: string): Promise<MarkReadResult> {
    const res = await fetch(`${BASE}/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: 'POST',
    })
    if (!res.ok) return parseError(res)
    return { ok: true }
}

// ─── Start or find DM conversation ───────────────────────────────────────────

export type StartConversationResult = { ok: true; conversation: ConversationRow } | MessagesError

export async function startConversation(targetUserId: string): Promise<StartConversationResult> {
    const res = await fetch(`${BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { conversation: ConversationRow }
    return { ok: true, conversation: json.conversation }
}

// ─── Start or find order conversation ────────────────────────────────────────

export async function startOrderConversation(orderId: string): Promise<StartConversationResult> {
    const res = await fetch(`${BASE}/start-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { conversation: ConversationRow }
    return { ok: true, conversation: json.conversation }
}
