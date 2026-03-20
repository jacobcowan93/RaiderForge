"use client"

import React, { useEffect, useState } from 'react'
import { listOffers, getOrderStatus, createOffer } from '../../api/g2gClient'
import { useAuth } from '../../context/UserContext'
import { signIn } from 'next-auth/react'

export default function MarketplacePage() {
    const { user, status } = useAuth()
    const [offers, setOffers] = useState<any[]>([])
    const [orderId, setOrderId] = useState('')
    const [orderStatus, setOrderStatus] = useState<any | null>(null)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (user) {
            const load = async () => {
                const o = await listOffers(user.id || user.email || 'user-123')
                setOffers(o)
            }
            load()
        }
    }, [user])

    if (status === 'loading') return <div className="py-8">Loading...</div>
    if (!user) return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Marketplace (G2G Mock)</h2>
            <p>Please sign in to access the marketplace.</p>
            <button onClick={() => signIn()} className="px-3 py-2 bg-rf-red text-black rounded-md">Sign In</button>
        </div>
    )

    const lookupOrder = async () => {
        const s = await getOrderStatus(orderId)
        setOrderStatus(s)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        const form = e.target as HTMLFormElement
        const fd = new FormData(form)
        const payload = { title: fd.get('title') as string, game: 'ARC Raiders', price: Number(fd.get('price')), quantity: Number(fd.get('quantity')) }
        const res = await createOffer(payload as any)
        setCreating(false)
        if (res.success) setOffers((s) => [...s, { id: res.id, ...payload, status: 'active' }])
    }

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Marketplace (G2G Mock)</h2>
            <p className="text-sm text-gray-400 mb-4">G2G integration uses server-side API keys stored in environment variables. Keys are never exposed in the browser.</p>

            <section className="mb-6">
                <h3 className="font-semibold">My Offers</h3>
                <div className="mt-2">
                    {offers.map((o) => (
                        <div key={o.id} className="rf-card p-3 mb-2 flex justify-between">
                            <div>
                                <div className="font-medium">{o.title}</div>
                                <div className="text-xs text-gray-400">{o.game}</div>
                            </div>
                            <div className="text-sm text-gray-200">${o.price} • {o.status}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-6 rf-card p-4">
                <h3 className="font-semibold">Order Status</h3>
                <div className="flex gap-2 mt-2">
                    <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID" className="p-2 bg-black/40 rounded-md" />
                    <button onClick={lookupOrder} className="px-3 py-2 bg-rf-red text-black rounded-md">Lookup</button>
                </div>
                {orderStatus && <pre className="mt-3 text-xs bg-black/30 p-2 rounded">{JSON.stringify(orderStatus, null, 2)}</pre>}
            </section>

            <section className="rf-card p-4">
                <h3 className="font-semibold">Create Offer</h3>
                <form onSubmit={handleCreate} className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input name="title" placeholder="Title" className="p-2 bg-black/40 rounded-md col-span-2" />
                    <input name="price" placeholder="Price" className="p-2 bg-black/40 rounded-md" />
                    <input name="quantity" placeholder="Quantity" className="p-2 bg-black/40 rounded-md" />
                    <button className="px-3 py-2 bg-rf-green text-black rounded-md" disabled={creating}>Create</button>
                </form>
            </section>
        </div>
    )
}
