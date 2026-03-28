'use client'

import type { FormEvent } from 'react'

import { btnPrimary, inputCls, selectCls, sectionHeading, LISTING_CURRENCIES } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'

export function MarketplaceListingForm({
    price,
    currency,
    quantity,
    notes,
    onPriceChange,
    onCurrencyChange,
    onQuantityChange,
    onNotesChange,
    onSubmit,
    submitting,
    submitError,
    canSubmit,
}: {
    price: string
    currency: string
    quantity: string
    notes: string
    onPriceChange: (v: string) => void
    onCurrencyChange: (v: string) => void
    onQuantityChange: (v: string) => void
    onNotesChange: (v: string) => void
    onSubmit: (e: FormEvent) => void
    submitting: boolean
    submitError: string | null
    canSubmit: boolean
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
                <label className={sectionHeading}>Pricing</label>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs text-rf-textSoft/70">Price</label>
                        <input
                            className={inputCls}
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => onPriceChange(e.target.value)}
                            disabled={submitting}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-rf-textSoft/70">Currency</label>
                        <select
                            className={selectCls}
                            value={currency}
                            onChange={(e) => onCurrencyChange(e.target.value)}
                            disabled={submitting}
                        >
                            {LISTING_CURRENCIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs text-rf-textSoft/70">Quantity</label>
                    <input
                        className={inputCls}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => onQuantityChange(e.target.value)}
                        disabled={submitting}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-rf-textSoft/70">Notes <span className="opacity-50">(optional)</span></label>
                    <textarea
                        className={inputCls + ' resize-none h-20'}
                        placeholder="Condition, trade details, or other notes…"
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        disabled={submitting}
                        maxLength={500}
                    />
                </div>
            </div>

            {submitError && <ErrorMsg msg={submitError} />}

            <button type="submit" className={btnPrimary + ' w-full py-2.5'} disabled={submitting || !canSubmit}>
                {submitting ? <><Spinner size={14} /> Posting…</> : 'Post Listing'}
            </button>
        </form>
    )
}
