"use client"

import React, { useEffect, useState } from 'react'
import { listOffers, getOrderStatus, createOffer, getDeliveryAttributes, parseWebhookPayload, getStoreSettings, searchWebhookLogs, type DeliveryAttributesResponse, type WebhookPayload, type WebhookLogSearchRequest } from '../../api/g2gClient'
import { useAuth } from '../../context/UserContext'
import { signIn } from 'next-auth/react'

export default function MarketplacePage() {
    const { user, status } = useAuth()
    const [offers, setOffers] = useState<any[]>([])
    const [orderId, setOrderId] = useState('')
    const [orderStatus, setOrderStatus] = useState<any | null>(null)
    const [creating, setCreating] = useState(false)
    const [deliveryAttributes, setDeliveryAttributes] = useState<DeliveryAttributesResponse | null>(null)
    const [webhookPayload, setWebhookPayload] = useState('')
    const [parsedWebhook, setParsedWebhook] = useState<any>(null)
    const [storeSettings, setStoreSettings] = useState<any>(null)
    const [webhookLogs, setWebhookLogs] = useState<any>(null)
    const [logSearchFilter, setLogSearchFilter] = useState('')

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

    const loadDeliveryAttributes = async () => {
        const attrs = await getDeliveryAttributes('product-123')
        setDeliveryAttributes(attrs)
    }

    const handleWebhookParse = () => {
        try {
            const payload: WebhookPayload = JSON.parse(webhookPayload)
            const parsed = parseWebhookPayload(payload)
            setParsedWebhook(parsed)
        } catch (e) {
            setParsedWebhook({ error: 'Invalid JSON' })
        }
    }

    const loadStoreSettings = async () => {
        const settings = await getStoreSettings()
        setStoreSettings(settings)
    }

    const searchLogs = async () => {
        const request: WebhookLogSearchRequest = {
            filter: {
                event_sent_from: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
                event_sent_to: Date.now()
            },
            limit: 10
        }

        if (logSearchFilter) {
            request.filter.event_type = logSearchFilter
        }

        const logs = await searchWebhookLogs(request)
        setWebhookLogs(logs)
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

            <section className="rf-card p-4">
                <h3 className="font-semibold">Delivery Attributes Demo</h3>
                <p className="text-sm text-gray-400 mb-3">Shows how to render delivery forms based on G2G API attributes.</p>
                <button onClick={loadDeliveryAttributes} className="px-3 py-2 bg-rf-blue text-white rounded-md mb-3">Load Attributes</button>

                {deliveryAttributes && (
                    <div className="space-y-4">
                        {deliveryAttributes.delivery_method_list.map((method) => (
                            <div key={method.delivery_method_id} className="border border-rf-border p-3 rounded">
                                <h4 className="font-medium">{method.delivery_method_name}</h4>
                                <div className="mt-2 space-y-2">
                                    {method.attribute_group_list.map((attr) => (
                                        <div key={attr.attribute_key}>
                                            <label className="block text-sm font-medium mb-1">
                                                {attr.attribute_group_name} {attr.required && '*'}
                                            </label>
                                            {attr.input_field === 'text' && (
                                                <input
                                                    type="text"
                                                    placeholder={`Enter ${attr.attribute_group_name.toLowerCase()}`}
                                                    className="w-full p-2 bg-black/40 border border-rf-border rounded"
                                                    name={attr.attribute_key}
                                                />
                                            )}
                                            {attr.input_field === 'dropdown' && attr.attribute_list && (
                                                <select
                                                    className="w-full p-2 bg-black/40 border border-rf-border rounded"
                                                    name={attr.attribute_key}
                                                >
                                                    <option value="">Select {attr.attribute_group_name.toLowerCase()}</option>
                                                    {attr.attribute_list.map((option) => (
                                                        <option key={option.attribute_id} value={option.attribute_id}>
                                                            {option.attribute_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rf-card p-4">
                <h3 className="font-semibold">Webhook Parser Demo</h3>
                <p className="text-sm text-gray-400 mb-3">Paste a webhook payload to see how delivery data is parsed.</p>
                <textarea
                    value={webhookPayload}
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    placeholder="Paste webhook JSON here..."
                    className="w-full h-32 p-2 bg-black/40 border border-rf-border rounded mb-3"
                />
                <button onClick={handleWebhookParse} className="px-3 py-2 bg-rf-yellow text-black rounded-md">Parse Webhook</button>

                {parsedWebhook && (
                    <pre className="mt-3 text-xs bg-black/30 p-3 rounded overflow-x-auto">
                        {JSON.stringify(parsedWebhook, null, 2)}
                    </pre>
                )}
            </section>

            <section className="rf-card p-4">
                <h3 className="font-semibold">Webhook Testing</h3>
                <p className="text-sm text-gray-400 mb-3">Test webhook signature verification and payload processing.</p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Webhook URL</label>
                        <input
                            type="text"
                            value="http://localhost:3000/api/webhooks/g2g"
                            readOnly
                            className="w-full p-2 bg-black/40 border border-rf-border rounded text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Sample Webhook Payload</label>
                        <select
                            className="w-full p-2 bg-black/40 border border-rf-border rounded mb-3"
                            onChange={(e) => {
                                const eventType = e.target.value
                                let samplePayload = ''

                                switch (eventType) {
                                    case 'order.created':
                                        samplePayload = `{
  "event_type": "order.created",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-123",
  "order_id": "order-123",
  "status": "pending"
}`
                                        break
                                    case 'order.confirmed':
                                        samplePayload = `{
  "event_type": "order.confirmed",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-124",
  "order_id": "order-123",
  "status": "paid"
}`
                                        break
                                    case 'order.delivery_status':
                                        samplePayload = `{
  "event_type": "order.delivery_status",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-125",
  "order_id": "order-123",
  "delivery_status": {
    "status": "fully_delivered",
    "delivered_quantity": 1,
    "total_quantity": 1
  }
}`
                                        break
                                    case 'order.api_delivery':
                                        samplePayload = `{
  "event_type": "order.api_delivery",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-126",
  "order_id": "order-123"
}`
                                        break
                                    case 'order.completed':
                                        samplePayload = `{
  "event_type": "order.completed",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-127",
  "order_id": "order-123"
}`
                                        break
                                    case 'order.case_opened':
                                        samplePayload = `{
  "event_type": "order.case_opened",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-128",
  "order_id": "order-123",
  "case_info": {
    "case_id": "case-456",
    "reason": "Item not received",
    "description": "Buyer did not receive the digital code"
  }
}`
                                        break
                                    case 'offer.low_stock':
                                        samplePayload = `{
  "event_type": "offer.low_stock",
  "timestamp": "${Date.now()}",
  "webhook_id": "wh-129",
  "offer_id": "offer-789",
  "current_stock": 2,
  "low_stock_threshold": 5
}`
                                        break
                                }

                                setWebhookPayload(samplePayload)
                            }}
                        >
                            <option value="">Select Event Type</option>
                            <option value="order.created">order.created</option>
                            <option value="order.confirmed">order.confirmed</option>
                            <option value="order.delivery_status">order.delivery_status</option>
                            <option value="order.api_delivery">order.api_delivery</option>
                            <option value="order.completed">order.completed</option>
                            <option value="order.case_opened">order.case_opened</option>
                            <option value="offer.low_stock">offer.low_stock</option>
                        </select>
                    </div>
                    <textarea
                        readOnly
                        className="w-full h-40 p-2 bg-black/40 border border-rf-border rounded text-xs font-mono"
                    ></textarea>
                </div>

                <div className="text-sm text-gray-400">
                    <p><strong>Webhook URL:</strong> Configure this in your G2G seller dashboard</p>
                    <p><strong>Security:</strong> Webhooks are verified using HMAC-SHA256 signatures</p>
                    <p><strong>Headers:</strong> g2g-signature, g2g-timestamp</p>
                </div>
            </section>

            <section className="rf-card p-4">
                <h3 className="font-semibold">Webhook Log Search</h3>
                <p className="text-sm text-gray-400 mb-3">Search and monitor webhook delivery logs for debugging.</p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Event Type Filter (optional)</label>
                        <select
                            value={logSearchFilter}
                            onChange={(e) => setLogSearchFilter(e.target.value)}
                            className="w-full p-2 bg-black/40 border border-rf-border rounded"
                        >
                            <option value="">All Events</option>
                            <option value="order.created">order.created</option>
                            <option value="order.confirmed">order.confirmed</option>
                            <option value="order.delivery_status">order.delivery_status</option>
                            <option value="order.api_delivery">order.api_delivery</option>
                            <option value="order.completed">order.completed</option>
                            <option value="order.case_opened">order.case_opened</option>
                            <option value="offer.low_stock">offer.low_stock</option>
                        </select>
                    </div>

                    <button onClick={searchLogs} className="px-3 py-2 bg-rf-yellow text-black rounded-md">
                        Search Webhook Logs
                    </button>
                </div>

                {webhookLogs && webhookLogs.payload.results.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-medium mb-2">Recent Webhook Logs ({webhookLogs.payload.results.length} results)</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {webhookLogs.payload.results.map((log, index) => (
                                <div key={index} className="bg-black/20 p-3 rounded border border-rf-border">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-rf-yellow">{log.event_type}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(log.event_sent_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div><strong>Event ID:</strong> {log.event_id}</div>
                                        <div><strong>HTTP Status:</strong> {log.http_status}</div>
                                        <div><strong>Response Time:</strong> {log.response_time}ms</div>
                                        <div><strong>Webhook URL:</strong> {log.webhook_url}</div>
                                        {log.http_request && log.http_request.payload && (
                                            <div><strong>Order ID:</strong> {log.http_request.payload.order_id || 'N/A'}</div>
                                        )}
                                    </div>
                                    {log.http_request && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-gray-400 cursor-pointer">View Payload</summary>
                                            <pre className="mt-1 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                                                {JSON.stringify(log.http_request, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {webhookLogs && webhookLogs.payload.results.length === 0 && (
                    <div className="mt-4 text-sm text-gray-400">
                        No webhook logs found for the specified criteria.
                    </div>
                )}
            </section>
        </div>
    )
}
