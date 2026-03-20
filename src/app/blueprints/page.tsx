"use client"

import { getBlueprintProgressSummary, getBlueprintsForUser } from '../../api/ardbClient'
import { useAuth } from '../../context/UserContext'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

function BlueprintList({ blueprints }: { blueprints: any[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blueprints.map((b) => (
                <div key={b.id} className="rf-card p-4 flex items-center justify-between">
                    <div>
                        <div className="font-semibold">{b.name}</div>
                        <div className="text-xs text-gray-400">{b.rarity}</div>
                    </div>
                    <div className={`${b.owned ? 'text-green-400' : 'text-red-400'}`}>{b.owned ? 'Owned' : 'Missing'}</div>
                </div>
            ))}
        </div>
    )
}

export default function BlueprintsPage() {
    const { user, status } = useAuth()
    const [summary, setSummary] = useState<any>(null)
    const [blueprints, setBlueprints] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            const load = async () => {
                const s = await getBlueprintProgressSummary(user.id || user.email || 'user-123')
                const b = await getBlueprintsForUser(user.id || user.email || 'user-123')
                setSummary(s)
                setBlueprints(b)
            }
            load()
        }
    }, [user])

    if (status === 'loading') return <div className="py-8">Loading...</div>
    if (!user) return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Blueprint Tracker</h2>
            <p>Please sign in to view your blueprints.</p>
            <button onClick={() => signIn()} className="px-3 py-2 bg-rf-red text-black rounded-md">Sign In</button>
        </div>
    )

    if (!summary) return <div className="py-8">Loading blueprints...</div>

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Blueprint Tracker</h2>
            <div className="mb-4">You own <strong>{summary.owned}</strong> of <strong>{summary.total}</strong> blueprints — {summary.percentage}%</div>
            <BlueprintList blueprints={blueprints} />
        </div>
    )
}
