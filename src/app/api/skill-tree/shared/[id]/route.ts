import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma()
    if (!prisma) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

    const { id } = await params
    const build = await prisma.sharedSkillTreeBuild.findUnique({ where: { id } })
    if (!build) return NextResponse.json({ error: "not_found" }, { status: 404 })
    if (build.userId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    await prisma.sharedSkillTreeBuild.delete({ where: { id } })
    return NextResponse.json({ ok: true })
}
