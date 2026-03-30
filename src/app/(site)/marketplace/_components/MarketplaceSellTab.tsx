'use client'

import { useEffect, useState, type FormEvent } from 'react'

import {
    createListing,
    fetchCatalogItems,
    type CatalogItemSummary,
    type ListingRow,
    type ListingsError,
} from '@/lib/marketplace/listings-api'
import { MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'

import { sectionHeading } from '../_lib/marketplace-constants'
import { Divider, ErrorMsg, Spinner, Toast } from './MarketplaceShared'
import { MarketplaceG2gPlaceholder } from './MarketplaceG2gPlaceholder'
import { MarketplaceItemPicker } from './MarketplaceItemPicker'
import { MarketplaceListingForm } from './MarketplaceListingForm'
import { MarketplaceListingOptimizer } from './MarketplaceListingOptimizer'

export function MarketplaceSellTab({
    userId,
    onListingPosted,
    persistenceDisabled,
}: {
    userId: string
    onListingPosted: (listing: ListingRow) => void
    /** When true, posting is blocked and the form is read-only (DB not configured). */
    persistenceDisabled: boolean
}) {
    const [catalogItems, setCatalogItems] = useState<CatalogItemSummary[]>([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [catalogSyncedAt, setCatalogSyncedAt] = useState<string | null>(null)

    const [selectedItem, setSelectedItem] = useState<CatalogItemSummary | null>(null)
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [quantity, setQuantity] = useState('1')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setCatalogLoading(true)
            setCatalogError(null)
            const r = await fetchCatalogItems()
            if (cancelled) return
            if (!r.ok) {
                setCatalogError('Could not load item catalog. Ensure a catalog sync has been run.')
            } else {
                setCatalogItems(r.items)
                setCatalogSyncedAt(r.syncedAt)
            }
            setCatalogLoading(false)
        })()
        return () => { cancelled = true }
    }, [userId])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (persistenceDisabled) {
            setSubmitError(MARKETPLACE_PERSISTENCE_UNAVAILABLE)
            return
        }
        if (!selectedItem) { setSubmitError('Select an item first.'); return }
        const priceVal = parseFloat(price)
        if (!Number.isFinite(priceVal) || priceVal <= 0) { setSubmitError('Enter a valid price.'); return }
        const qtyVal = Math.max(1, parseInt(quantity, 10) || 1)

        setSubmitting(true)
        setSubmitError(null)
        const r = await createListing({
            ardbItemId: selectedItem.ardbId,
            price: priceVal,
            currency,
            quantity: qtyVal,
            notes: notes.trim() || undefined,
        })
        setSubmitting(false)
        if (!r.ok) {
            const err = r as ListingsError
            setSubmitError(err.message ?? err.error)
            return
        }
        onListingPosted(r.listing)
        setSelectedItem(null)
        setPrice('')
        setQuantity('1')
        setNotes('')
        setToast('Listing posted!')
    }

    return (
        <div className="space-y-6">
            {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

            <MarketplaceG2gPlaceholder />

            <div className="space-y-1.5">
                <label className={sectionHeading}>Item</label>
                {catalogLoading ? (
                    <div className="flex items-center gap-2 py-3 text-rf-textSoft/50">
                        <Spinner size={14} />
                        <span className="text-xs">Loading item catalog…</span>
                    </div>
                ) : catalogError ? (
                    <div className="space-y-1">
                        <ErrorMsg msg={catalogError} />
                        <p className="text-[10px] text-rf-textSoft/40">
                            An admin may need to run a catalog sync at{' '}
                            <code className="bg-white/[0.06] px-1 rounded">/api/marketplace/catalog/sync</code>
                        </p>
                    </div>
                ) : (
                    <>
                        <MarketplaceItemPicker
                            items={catalogItems}
                            value={selectedItem}
                            onChange={setSelectedItem}
                            disabled={submitting || persistenceDisabled}
                        />
                        {catalogSyncedAt && (
                            <p className="text-[9px] text-rf-textSoft/35">
                                Catalog synced {new Date(catalogSyncedAt).toLocaleDateString()}
                                {' · '}
                                <a
                                    href="https://ardb.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-1 hover:text-rf-textSoft/60"
                                >
                                    ardb.app
                                </a>
                            </p>
                        )}
                    </>
                )}
            </div>

            <Divider />

            <MarketplaceListingOptimizer
                item={selectedItem}
                price={price}
                currency={currency}
                quantity={quantity}
                notes={notes}
                disabled={submitting || persistenceDisabled}
            />

            <Divider />

            <MarketplaceListingForm
                price={price}
                currency={currency}
                quantity={quantity}
                notes={notes}
                onPriceChange={setPrice}
                onCurrencyChange={setCurrency}
                onQuantityChange={setQuantity}
                onNotesChange={setNotes}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitError={submitError}
                canSubmit={Boolean(selectedItem) && !persistenceDisabled}
                fieldsDisabled={persistenceDisabled}
            />
        </div>
    )
}
