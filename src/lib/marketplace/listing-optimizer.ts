type OptimizerItemInput = {
    name: string
    itemType: string | null
    rarity: string | null
    description: string | null
    foundIn: string[]
}

export type OptimizeListingInput = {
    item: OptimizerItemInput
    price: number | null
    currency: string | null
    quantity: number | null
    notes: string | null
}

function buildPrompt(input: OptimizeListingInput) {
    const { item, price, currency, quantity, notes } = input
    const detailLines = [
        `- Item name / title: ${item.name}`,
        `- Item type / category: ${item.itemType ?? 'Unknown'}`,
        `- Condition / rarity: ${item.rarity ?? 'Not provided'}`,
        `- Current price: ${price !== null ? `${price} ${currency ?? 'USD'}` : 'Not provided'}`,
        `- Quantity: ${quantity ?? 1}`,
        `- Key features: ${
            [
                item.description?.trim() || null,
                item.foundIn.length > 0 ? `Found in: ${item.foundIn.slice(0, 3).join(', ')}` : null,
                notes?.trim() || null,
            ]
                .filter(Boolean)
                .join(' | ') || 'No extra seller notes provided'
        }`,
    ]

    return [
        'Create a RaiderForge-native marketplace listing for ARC Raiders players.',
        'Return polished plain text only, using exactly these sections and headings:',
        'Title:',
        'Description:',
        'Tags:',
        'Visual Recommendations:',
        'Pricing Suggestion:',
        '',
        'Rules:',
        '- Title must be 60 characters or less.',
        '- Description must be 150 to 300 words.',
        '- Use flat bullet points inside the description only when helpful.',
        '- Include 10 to 15 search tags in a single comma-separated line.',
        '- Sound premium, modern, clear, and trustworthy.',
        '- Use exciting but not cringy language.',
        '- Focus on rarity, quality, uniqueness, and browse visibility.',
        '- Fit RaiderForge: dark, polished marketplace, in development, reputation-based trading coming soon.',
        '- Do not invent unsupported guarantees or fake urgency.',
        '- Make the result fully ready to copy-paste.',
        '',
        'Item details:',
        ...detailLines,
    ].join('\n')
}

function extractOutputText(payload: unknown): string {
    if (!payload || typeof payload !== 'object') return ''
    const topLevel = (payload as { output_text?: unknown }).output_text
    if (typeof topLevel === 'string' && topLevel.trim()) return topLevel.trim()

    const output = (payload as { output?: unknown }).output
    if (!Array.isArray(output)) return ''

    const text = output
        .flatMap((entry) => {
            if (!entry || typeof entry !== 'object') return []
            const content = (entry as { content?: unknown }).content
            return Array.isArray(content) ? content : []
        })
        .map((chunk) => {
            if (!chunk || typeof chunk !== 'object') return ''
            if ((chunk as { type?: unknown }).type !== 'output_text') return ''
            const textValue = (chunk as { text?: unknown }).text
            return typeof textValue === 'string' ? textValue : ''
        })
        .filter(Boolean)
        .join('\n')
        .trim()

    return text
}

export async function generateOptimizedListing(input: OptimizeListingInput) {
    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured for marketplace listing optimization.')
    }

    const model = process.env.OPENAI_MARKETPLACE_MODEL?.trim() || 'gpt-4o-mini'
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            max_output_tokens: 900,
            input: [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'input_text',
                            text: 'You are an expert RaiderForge marketplace listing optimizer for ARC Raiders items.',
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: buildPrompt(input),
                        },
                    ],
                },
            ],
            text: {
                format: {
                    type: 'text',
                },
            },
        }),
    })

    if (!response.ok) {
        const details = await response.text().catch(() => '')
        throw new Error(details || 'OpenAI request failed.')
    }

    const payload = await response.json()
    const output = extractOutputText(payload)
    if (!output) {
        throw new Error('OpenAI returned an empty optimizer response.')
    }

    return { output, model }
}
