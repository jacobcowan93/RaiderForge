import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getPrisma(): PrismaClient | undefined {
    const url = process.env.DATABASE_URL?.trim()
    if (!url) return undefined

    if (!globalForPrisma.prisma) {
        const adapter = new PrismaNeon({ connectionString: url })
        globalForPrisma.prisma = new PrismaClient({ adapter })
    }
    return globalForPrisma.prisma
}
