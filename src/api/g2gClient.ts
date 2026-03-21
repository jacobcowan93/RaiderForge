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

// Delivery Attributes Types (for Top Up services)
export type AttributeOption = {
    attribute_id: string
    attribute_name: string
}

export type AttributeGroup = {
    attribute_key: string // e.g., "delivery_info_1", "delivery_info_2"
    attribute_group_name: string // Human-readable label like "User ID"
    input_field: 'text' | 'dropdown' | 'number' // Type of input to render
    attribute_list?: AttributeOption[] // For dropdowns, the available options
    required?: boolean
}

export type DeliveryMethod = {
    delivery_method_id: string
    delivery_method_name: string
    attribute_group_list: AttributeGroup[]
}

export type DeliveryAttributesResponse = {
    delivery_method_list: DeliveryMethod[]
}

// Webhook payload types
export type WebhookAttributeValue = {
    attribute_key: string
    attribute_group_name: string
    value?: string // For text inputs
    attribute_id?: string // For dropdown selections
    attribute_value?: string // For dropdown selections
}

export type WebhookPayload = {
    delivery_method_list: Array<{
        delivery_method_id: string
        delivery_method_name: string
        attribute_list: WebhookAttributeValue[]
    }>
    order_id?: string
    status?: string
    buyer_info?: {
        email?: string
        user_id?: string
    }
}

export type WebhookLogSearchFilter = {
    event_sent_from?: number // Unix timestamp in milliseconds
    event_sent_to?: number // Unix timestamp in milliseconds
    event_id?: string
    event_type?: string
    http_status?: number
    order_id?: string
    offer_id?: string
    product_id?: string
}

export type WebhookLogSearchRequest = {
    filter: WebhookLogSearchFilter
    limit?: number // default 20
    sort_order?: 'asc' | 'desc' // default 'asc'
    after?: string
}

export type WebhookLogEntry = {
    event_id: string
    event_type: string
    webhook_url: string
    http_status: number
    http_request: any // The webhook payload sent
    response_time: number // in milliseconds
    event_sent_at: number // Unix timestamp
}

export type WebhookLogSearchResponse = {
    request_id: string
    code: string
    message: string
    warning: string
    payload: {
        results: WebhookLogEntry[]
        after?: string
    }
}

// Webhook Event Types
export type OrderEventType =
    | 'order.created'
    | 'order.confirmed'
    | 'order.delivery_status'
    | 'order.api_delivery'
    | 'order.cancelled'
    | 'order.completed'
    | 'order.rollback_cancelled'
    | 'order.rollback_completed'
    | 'order.case_opened'

export type OfferEventType = 'offer.low_stock'

export type WebhookEventType = OrderEventType | OfferEventType

export type BaseWebhookEvent = {
    event_type: WebhookEventType
    timestamp: string
    webhook_id: string
}

export type OrderWebhookEvent = BaseWebhookEvent & {
    event_type: OrderEventType
    order_id: string
    status?: string
    delivery_method_list?: Array<{
        delivery_method_id: string
        delivery_method_name: string
        attribute_list: WebhookAttributeValue[]
    }>
    buyer_info?: {
        email?: string
        user_id?: string
    }
    delivery_status?: {
        status: 'fully_delivered' | 'partial_delivered' | 'unfulfilled'
        delivered_quantity?: number
        total_quantity?: number
    }
    case_info?: {
        case_id: string
        reason: string
        description: string
    }
}

export type OfferWebhookEvent = BaseWebhookEvent & {
    event_type: OfferEventType
    offer_id: string
    current_stock: number
    low_stock_threshold: number
}

export type WebhookEvent = OrderWebhookEvent | OfferWebhookEvent

// Store Settings Types (from /v2/store endpoint)
export type SellingCurrency = {
    currency: string // e.g., "USD", "MYR"
}

export type StoreSettings = {
    user_id: string
    account_status: string // e.g., "active"
    seller_status: string // e.g., "active"
    selling_currencies: SellingCurrency[]
}

export type StoreResponse = {
    request_id: string
    code: string // "20000001" for success
    message: string
    warning: string
    payload: StoreSettings
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

// Delivery Attributes Functions
const mockDeliveryAttributes: DeliveryAttributesResponse = {
    delivery_method_list: [
        {
            delivery_method_id: 'dm-1',
            delivery_method_name: 'In-Game Delivery',
            attribute_group_list: [
                {
                    attribute_key: 'delivery_info_1',
                    attribute_group_name: 'User ID',
                    input_field: 'text',
                    required: true
                },
                {
                    attribute_key: 'delivery_info_2',
                    attribute_group_name: 'Server',
                    input_field: 'dropdown',
                    required: true,
                    attribute_list: [
                        { attribute_id: 'srv-1', attribute_name: 'Aldebaran' },
                        { attribute_id: 'srv-2', attribute_name: 'Sirius' },
                        { attribute_id: 'srv-3', attribute_name: 'Vega' }
                    ]
                }
            ]
        }
    ]
}

// FUTURE (real HTTP example):
// const path = `/delivery-attributes/${productId}`
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, { headers: { 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature }})
export async function getDeliveryAttributes(productId: string): Promise<DeliveryAttributesResponse> {
    await new Promise((r) => setTimeout(r, 200))
    return mockDeliveryAttributes
}

// Webhook handling function
export function parseWebhookPayload(payload: WebhookPayload): Record<string, any> {
    const deliveryData: Record<string, any> = {}

    for (const deliveryMethod of payload.delivery_method_list) {
        for (const attribute of deliveryMethod.attribute_list) {
            const key = attribute.attribute_key

            switch (attribute.attribute_key) {
                case 'delivery_info_1':
                    deliveryData.userId = attribute.value
                    break
                case 'delivery_info_2':
                    deliveryData.serverId = attribute.attribute_id
                    deliveryData.serverName = attribute.attribute_value
                    break
                default:
                    // Store other attributes dynamically
                    deliveryData[key] = {
                        value: attribute.value,
                        attributeId: attribute.attribute_id,
                        attributeValue: attribute.attribute_value
                    }
            }
        }
    }

    return {
        orderId: payload.order_id,
        status: payload.status,
        deliveryData,
        buyerInfo: payload.buyer_info
    }
}

// Store Settings Functions
const mockStoreSettings: StoreResponse = {
    request_id: 'f0e7857a-4d11-4115-98dc-d71e387299bc',
    code: '20000001',
    message: '',
    warning: '',
    payload: {
        user_id: '684814',
        account_status: 'active',
        seller_status: 'active',
        selling_currencies: [
            { currency: 'MYR' },
            { currency: 'USD' }
        ]
    }
}

// FUTURE (real HTTP example):
// const path = '/v2/store'
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, { headers: { 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature }})
export async function getStoreSettings(): Promise<StoreResponse> {
    await new Promise((r) => setTimeout(r, 200))
    return mockStoreSettings
}

// Webhook Signature Verification
export function verifyWebhookSignature(
    webhookUrl: string,
    userId: string,
    timestamp: string,
    receivedSignature: string,
    secretToken: string
): boolean {
    const canonicalString = webhookUrl + userId + timestamp

    const expectedSignature = require('crypto').createHmac('sha256', secretToken)
        .update(canonicalString)
        .digest('hex')

    // Use constant-time comparison to prevent timing attacks
    return require('crypto').timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
    )
}

// Webhook handler function
export async function handleG2GWebhook(
    request: Request,
    webhookUrl: string
): Promise<{ isValid: boolean; data?: any; error?: string }> {
    try {
        const signature = request.headers.get('g2g-signature')
        const timestamp = request.headers.get('g2g-timestamp')

        if (!signature || !timestamp) {
            return { isValid: false, error: 'Missing signature or timestamp headers' }
        }

        // Check timestamp to prevent replay attacks (allow 5 minute window)
        const now = Date.now()
        const requestTime = parseInt(timestamp)
        const timeDiff = Math.abs(now - requestTime)

        if (timeDiff > 5 * 60 * 1000) { // 5 minutes
            return { isValid: false, error: 'Request timestamp too old' }
        }

        const isValidSignature = verifyWebhookSignature(
            webhookUrl,
            g2gEnv.username,
            timestamp,
            signature,
            g2gEnv.secret
        )

        if (!isValidSignature) {
            return { isValid: false, error: 'Invalid signature' }
        }

        const body = await request.json()
        const processedEvent = processWebhookEvent(body)

        return { isValid: true, data: processedEvent }

    } catch (error) {
        return { isValid: false, error: `Webhook processing error: ${error.message}` }
    }
}

// Process different webhook event types
export function processWebhookEvent(event: any): any {
    const { event_type } = event

    switch (event_type) {
        case 'order.created':
            return handleOrderCreated(event)
        case 'order.confirmed':
            return handleOrderConfirmed(event)
        case 'order.delivery_status':
            return handleOrderDeliveryStatus(event)
        case 'order.api_delivery':
            return handleOrderApiDelivery(event)
        case 'order.cancelled':
            return handleOrderCancelled(event)
        case 'order.completed':
            return handleOrderCompleted(event)
        case 'order.rollback_cancelled':
            return handleOrderRollbackCancelled(event)
        case 'order.rollback_completed':
            return handleOrderRollbackCompleted(event)
        case 'order.case_opened':
            return handleOrderCaseOpened(event)
        case 'offer.low_stock':
            return handleOfferLowStock(event)
        default:
            return {
                eventType: 'unknown',
                rawEvent: event,
                message: `Unknown event type: ${event_type}`
            }
    }
}

// Event handlers for different webhook types
function handleOrderCreated(event: OrderWebhookEvent) {
    console.log(`🆕 Order Created: ${event.order_id}`)
    // TODO: Reserve inventory, prepare for potential payment
    return {
        eventType: 'order.created',
        orderId: event.order_id,
        action: 'Order placed but not yet paid',
        nextSteps: ['Monitor for payment confirmation']
    }
}

function handleOrderConfirmed(event: OrderWebhookEvent) {
    console.log(`💰 Order Confirmed: ${event.order_id}`)
    // TODO: Process payment received, begin delivery preparation
    return {
        eventType: 'order.confirmed',
        orderId: event.order_id,
        action: 'Payment confirmed, ready for delivery',
        nextSteps: ['Prepare delivery', 'Update order status']
    }
}

function handleOrderDeliveryStatus(event: OrderWebhookEvent) {
    console.log(`📦 Delivery Status Update: ${event.order_id} - ${event.delivery_status?.status}`)
    // TODO: Update delivery tracking, notify buyer
    return {
        eventType: 'order.delivery_status',
        orderId: event.order_id,
        deliveryStatus: event.delivery_status,
        action: `Delivery ${event.delivery_status?.status}`,
        nextSteps: event.delivery_status?.status === 'unfulfilled'
            ? ['Investigate delivery failure', 'Contact support']
            : ['Confirm delivery with buyer']
    }
}

function handleOrderApiDelivery(event: OrderWebhookEvent) {
    console.log(`🚀 API Delivery Ready: ${event.order_id}`)
    // TODO: Call Deliver Code API immediately
    return {
        eventType: 'order.api_delivery',
        orderId: event.order_id,
        action: 'Ready for API delivery',
        nextSteps: ['Call Deliver Code API', 'Send codes to buyer']
    }
}

function handleOrderCancelled(event: OrderWebhookEvent) {
    console.log(`❌ Order Cancelled: ${event.order_id}`)
    // TODO: Release reserved inventory, refund if needed
    return {
        eventType: 'order.cancelled',
        orderId: event.order_id,
        action: 'Order cancelled due to payment failure',
        nextSteps: ['Release inventory', 'Process refund if applicable']
    }
}

function handleOrderCompleted(event: OrderWebhookEvent) {
    console.log(`✅ Order Completed: ${event.order_id}`)
    // TODO: Mark as successfully delivered, update analytics
    return {
        eventType: 'order.completed',
        orderId: event.order_id,
        action: 'Buyer confirmed receipt',
        nextSteps: ['Update order status', 'Process final settlement']
    }
}

function handleOrderRollbackCancelled(event: OrderWebhookEvent) {
    console.log(`🔄 Order Rollback Cancelled: ${event.order_id}`)
    // TODO: Handle edge case where cancelled order becomes unpaid again
    return {
        eventType: 'order.rollback_cancelled',
        orderId: event.order_id,
        action: 'Cancelled order moved back to unpaid',
        nextSteps: ['Monitor for payment', 'Reset order state']
    }
}

function handleOrderRollbackCompleted(event: OrderWebhookEvent) {
    console.log(`⚠️ Order Rollback Completed: ${event.order_id}`)
    // TODO: Handle buyer reporting issues after confirmation
    return {
        eventType: 'order.rollback_completed',
        orderId: event.order_id,
        action: 'Buyer reported issue after confirming receipt',
        nextSteps: ['Investigate reported issue', 'Check resolution center']
    }
}

function handleOrderCaseOpened(event: OrderWebhookEvent) {
    console.log(`📋 Case Opened: ${event.order_id} - ${event.case_info?.reason}`)
    // TODO: Investigate case in G2G resolution center
    return {
        eventType: 'order.case_opened',
        orderId: event.order_id,
        caseInfo: event.case_info,
        action: 'Buyer reported an issue',
        nextSteps: ['Investigate in G2G resolution center', 'Respond to case']
    }
}

function handleOfferLowStock(event: OfferWebhookEvent) {
    console.log(`📉 Low Stock Alert: ${event.offer_id} - ${event.current_stock} remaining`)
    // TODO: Restock or adjust pricing
    return {
        eventType: 'offer.low_stock',
        offerId: event.offer_id,
        currentStock: event.current_stock,
        threshold: event.low_stock_threshold,
        action: 'Offer below low stock threshold',
        nextSteps: ['Restock inventory', 'Consider price adjustment']
    }
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

// Webhook Log Search Types

// Webhook Logs Functions
const mockWebhookLogs: WebhookLogSearchResponse = {
    request_id: '19951185-d16e-4ab5-968d-d1ce66b1b7df',
    code: '20000001',
    message: '',
    warning: '',
    payload: {
        results: [
            {
                event_id: 'ad7ade62-1981-4ce1-b280-983caef3a44b-1',
                event_type: 'order.confirmed',
                webhook_url: 'http://localhost:3000/api/webhooks/g2g',
                http_status: 200,
                http_request: {
                    event_type: 'order.confirmed',
                    payload: {
                        order_id: '1659694996896NH0Y-1',
                        order_status: 'verifying_payment',
                        amount: 1.6,
                        buyer_id: '1000000423',
                        seller_id: '1000000422'
                    },
                    id: 'ad7ade62-1981-4ce1-b280-983caef3a44b-1',
                    event_happened_at: 1659695012145
                },
                response_time: 0,
                event_sent_at: 1659695016249
            },
            {
                event_id: '59d6b795-0e87-4788-b793-6b2b94838c4d-1',
                event_type: 'order.api_delivery',
                webhook_url: 'http://localhost:3000/api/webhooks/g2g',
                http_status: 200,
                http_request: {
                    event_type: 'order.api_delivery',
                    payload: {
                        order_id: '1659694996896NH0Y-1',
                        delivery_qty: 10,
                        delivery_id: 'D1659695025419',
                        buyer_id: '1000000423',
                        seller_id: '1000000422'
                    },
                    id: '59d6b795-0e87-4788-b793-6b2b94838c4d-1',
                    event_happened_at: 1659695025419
                },
                response_time: 1,
                event_sent_at: 1659695027366
            }
        ],
        after: '1659695025419'
    }
}

// FUTURE (real HTTP example):
// const path = '/v2/logs/webhooks/search'
// const timestamp = Date.now().toString()
// const signature = signG2GRequest({ path, apiKey: g2gEnv.apiKey, userId: g2gEnv.username, timestamp, secret: g2gEnv.secret })
// await fetch(`${process.env.G2G_API_BASE}${path}`, {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json', 'g2g-api-key': g2gEnv.apiKey, 'g2g-userid': g2gEnv.username, 'g2g-timestamp': timestamp, 'g2g-signature': signature },
//   body: JSON.stringify(request)
// })
export async function searchWebhookLogs(request: WebhookLogSearchRequest): Promise<WebhookLogSearchResponse> {
    await new Promise((r) => setTimeout(r, 300))
    return mockWebhookLogs
}
