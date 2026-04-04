'use client'

import { useState } from 'react'

import { optimizeListingCopy, type CatalogItemSummary, type ListingsError } from '@/lib/marketplace/listings-api'

import { btnGhost, btnPrimary, sectionHeading } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'

export function MarketplaceListingOptimizer({
    item,
    price,
    currency,
    quantity,
    notes,
    disabled,
}: {
    item: CatalogItemSummary | null
    price: string
    currency: string
    quantity: string
    notes: string
    disabled?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [output, setOutput] = useState('')
    const [model, setModel] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const canGenerate = Boolean(item) && !disabled && !loading

    async function handleGenerate() {
        if (!item || disabled) return

        setLoading(true)
        setError(null)
        setCopied(false)

        const parsedPrice = price.trim() ? parseFloat(price) : null
        const parsedQuantity = quantity.trim() ? parseInt(quantity, 10) : null

        try {
            const result = await optimizeListingCopy({
                item,
                price: Number.isFinite(parsedPrice) ? parsedPrice : null,
                currency,
                quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : null,
                notes: notes.trim() || null,
            })

            if (!result.ok) {
                const err = result as ListingsError
                setError(err.message ?? err.error)
                return
            }

            setOutput(result.output)
            setModel(result.model)
        } catch {
            setError('Could not reach the listing optimizer right now.')
        } finally {
            setLoading(false)
        }
    }

    async function handleCopy() {
        if (!output) return
        try {
            await navigator.clipboard.writeText(output)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            setError('Could not copy the optimized listing. You can still select and copy it manually.')
        }
    }

    return (
        <section className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className={sectionHeading}>AI Listing Optimizer</p>
                        <span className="inline-flex items-center gap-1 rounded-md border border-rf-cyan/25 bg-rf-cyan/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rf-cyan/80">
                            G2G-Ready
                        </span>
                    </div>
                    <p className="text-sm text-white/78 leading-relaxed">
                        Generate a listing-ready title, description, tags, and pricing note — structured for both RaiderForge and the upcoming G2G offer format (title, description, price, quantity, attributes).
                    </p>
                </div>
                <button type="button" className={btnPrimary} onClick={handleGenerate} disabled={!canGenerate}>
                    {loading ? <><Spinner size={14} /> Generating…</> : 'Generate Copy'}
                </button>
            </div>

            {!item ? (
                <p className="text-xs text-white/55 leading-relaxed">
                    Pick an item first, then generate a copy-ready listing draft tailored to RaiderForge browse and search behavior.
                </p>
            ) : null}

            {item ? (
                <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5 text-xs text-white/68 leading-relaxed">
                    <span className="text-white font-semibold">{item.name}</span>
                    {item.rarity ? ` · ${item.rarity}` : ''}
                    {item.itemType ? ` · ${item.itemType}` : ''}
                    {price.trim() ? ` · ${price.trim()} ${currency}` : ''}
                </div>
            ) : null}

            {error ? <ErrorMsg msg={error} /> : null}

            {output ? (
                <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">
                            Ready to copy{model ? ` · ${model}` : ''}
                        </p>
                        <button type="button" className={btnGhost} onClick={handleCopy}>
                            {copied ? 'Copied' : 'Copy Output'}
                        </button>
                    </div>
                    <textarea
                        readOnly
                        value={output}
                        className="min-h-[20rem] w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm leading-relaxed text-white outline-none"
                    />
                </div>
            ) : null}
        </section>
    )
}
