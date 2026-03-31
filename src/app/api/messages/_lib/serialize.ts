import type { ConversationRow, MessageRow } from '@/lib/messages/messages-api'

type DbUser = { id: string; name: string | null; image: string | null }

type DbConversation = {
    id: string
    participantAId: string
    participantBId: string
    participantA: DbUser
    participantB: DbUser
    orderId: string | null
    updatedAt: Date
    createdAt: Date
    messages: Array<{
        id: string
        senderId: string
        body: string
        readAt: Date | null
        createdAt: Date
    }>
    _count?: { messages: number }
}

export function serializeConversation(conv: DbConversation, currentUserId: string): ConversationRow {
    const otherUser = conv.participantAId === currentUserId ? conv.participantB : conv.participantA
    const last = conv.messages[conv.messages.length - 1] ?? null
    const unreadCount = conv.messages.filter(
        (m) => m.senderId !== currentUserId && m.readAt === null,
    ).length

    return {
        id: conv.id,
        otherUser: { id: otherUser.id, name: otherUser.name, image: otherUser.image },
        lastMessage: last
            ? { body: last.body, createdAt: last.createdAt.toISOString(), senderId: last.senderId }
            : null,
        unreadCount,
        orderId: conv.orderId,
        updatedAt: conv.updatedAt.toISOString(),
        createdAt: conv.createdAt.toISOString(),
    }
}

export function serializeMessage(msg: {
    id: string
    senderId: string
    body: string
    readAt: Date | null
    createdAt: Date
}): MessageRow {
    return {
        id: msg.id,
        senderId: msg.senderId,
        body: msg.body,
        readAt: msg.readAt?.toISOString() ?? null,
        createdAt: msg.createdAt.toISOString(),
    }
}
