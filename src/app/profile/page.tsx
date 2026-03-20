"use client"

import React, { useState } from 'react'
import { useAuth } from '../../context/UserContext'
import { signIn } from 'next-auth/react'
import { getRaiderProfileSyncData } from '../../api/metaforgeClient'

export default function ProfilePage() {
    const { user, status } = useAuth()
    const [raiderId, setRaiderId] = useState<string>('')
    const [sync, setSync] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)

    if (status === 'loading') return <div className="py-8">Loading...</div>
    if (!user) return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <p>Please sign in to view your profile.</p>
            <button onClick={() => signIn()} className="px-3 py-2 bg-rf-red text-black rounded-md">Sign In</button>
        </div>
    )

    const doSync = async () => {
        setLoading(true)
        try {
            const data = await getRaiderProfileSyncData(raiderId || 'sample-raider')
            setSync(data)
        } catch (e) {
            setSync({ error: 'Sync failed (mock)' })
        }
        setLoading(false)
    }

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <div className="rf-card p-4 mb-4">
                <label className="block text-sm text-gray-300">In-game name</label>
                <input value={user.name || ''} onChange={() => { }} className="mt-1 p-2 bg-black/40 rounded-md w-full" disabled />
            </div>

            <div className="rf-card p-4 mb-4">
                <label className="block text-sm text-gray-300">MetaForge Raider ID</label>
                <div className="flex gap-2 mt-2">
                    <input value={raiderId} onChange={(e) => setRaiderId(e.target.value)} placeholder="Enter Raider ID" className="p-2 bg-black/40 rounded-md w-full" />
                    <button onClick={doSync} className="px-3 py-2 bg-rf-red text-black rounded-md">Sync</button>
                </div>
                <div className="mt-3 text-sm text-gray-300">
                    {loading && <span>Syncing...</span>}
                    {sync && !loading && <pre className="text-xs bg-black/30 p-2 rounded">{JSON.stringify(sync, null, 2)}</pre>}
                </div>
            </div>

            <div className="rf-card p-4">
                <h3 className="font-semibold">Blueprint Summary</h3>
                <p className="text-sm text-gray-300">Quick overview available — <a href="/blueprints" className="text-rf-yellow underline">View Blueprints</a></p>
            </div>
        </div>
    )
}
