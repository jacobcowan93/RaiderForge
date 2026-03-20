// Mock G2G client for marketplace integration
// NOTE: This client is mocked. Real HTTP calls will use server-side keys from `src/config/env.ts`.
// TODO: Wire the real G2G_API_BASE and use `g2gEnv` for signed requests.

import { g2gEnv } from '../config/env'

export type Offer = {
    id: string
    title: string
    game: string
    price: number
    quantity: number
    status: 'active' | 'sold' | 'removed'
}

export type CreateOfferPayload = {
    title: string
    game: string
    price: number
    quantity: number
    details?: string
}

export type OrderStatus = {
    orderId: string
    status: 'pending' | 'delivered' | 'cancelled' | 'failed'
    note?: string
}

const mockOffers: Offer[] = [
    { id: 'o-1', title: 'Blueprint Pack - ARC', game: 'ARC Raiders', price: 19.99, quantity: 1, status: 'active' }
]

// FUTURE (real HTTP example):
// const path = '/offers'
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, { method: 'GET', headers: { 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature }})
export async function listOffers(userId: string): Promise<Offer[]> {
    await new Promise((r) => setTimeout(r, 200))
    return mockOffers
}

// FUTURE (real HTTP example):
// const path = `/orders/${orderId}`
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, { headers: { 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature }})
export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
    await new Promise((r) => setTimeout(r, 200))
    return { orderId, status: 'delivered', note: 'Mock delivered' }
}

// FUTURE (real HTTP example):
// const path = '/offers/create'
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature }, body: JSON.stringify(payload) })
export async function createOffer(payload: CreateOfferPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    await new Promise((r) => setTimeout(r, 300))
    return { success: true, id: 'o-new' }
}
