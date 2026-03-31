import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to check messages.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id

    const count = await prisma.message.count({
        where: {
            senderId: { not: userId },
            readAt: null,
            conversation: {
                OR: [
                    { participantAId: userId },
                    { participantBId: userId },
                ],
            },
        },
    })

    return NextResponse.json({ count })
}
