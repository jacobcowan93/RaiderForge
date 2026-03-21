import { NextRequest, NextResponse } from 'next/server'
import { handleG2GWebhook } from '../../../../api/g2gClient'

// Webhook endpoint for G2G order notifications
// This endpoint should be configured in your G2G seller dashboard
export async function POST(request: NextRequest) {
    try {
        // Get the webhook URL (this should match what you configured in G2G)
        const webhookUrl = process.env.G2G_WEBHOOK_URL || `${process.env.NEXTAUTH_URL}/api/webhooks/g2g`

        const result = await handleG2GWebhook(request, webhookUrl)

        if (!result.isValid) {
            console.error('Invalid G2G webhook:', result.error)
            return NextResponse.json(
                { error: 'Invalid webhook signature' },
                { status: 401 }
            )
        }

        // Process the valid webhook data
        const { data } = result
        console.log('Received valid G2G webhook:', JSON.stringify(data, null, 2))

        // Here you would typically:
        // 1. Update order status in your database
        // 2. Send notifications to the buyer
        // 3. Process delivery information
        // 4. Update inventory if needed

        // For now, just log and return success
        return NextResponse.json({
            status: 'success',
            message: 'Webhook processed successfully',
            orderId: data.orderId,
            orderStatus: data.status
        })

    } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Optional: Handle GET requests for webhook URL verification
export async function GET() {
    return NextResponse.json({
        message: 'G2G Webhook endpoint is active',
        configured: true
    })
}