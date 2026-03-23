"use client"

import { useMarketplaceBrowse } from '@/hooks/useMarketplaceBrowse'
import { getG2GOfferExternalUrl } from '@/lib/marketplace/g2g-offer-url'

export default function MarketplacePage() {
    const b = useMarketplaceBrowse()

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-2">Marketplace</h2>
            <p className="text-sm text-gray-400 mb-6">
                Catalog data loads from RaiderForge API routes only; G2G credentials stay on the server. Purchases
                complete on G2G.
            </p>
            <p className="text-xs text-gray-500 mb-6">
                ARC Raiders item reference metadata is periodically synced from{' '}
                <a href="https://ardb.app/" target="_blank" rel="noopener noreferrer" className="underline">
                    ARDB
                </a>
                . See their{' '}
                <a href="https://ardb.app/developers/api" target="_blank" rel="noopener noreferrer" className="underline">
                    API terms
                </a>
                ; endpoint shapes may change. G2G integration is separate and covers offers only.
            </p>

            <section className="rf-card p-4 mb-6">
                <h3 className="font-semibold mb-3">Browse catalog</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Service</label>
                        <select
                            value={b.serviceId}
                            onChange={(e) => b.setServiceId(e.target.value)}
                            className="w-full p-2 bg-black/40 border border-rf-border rounded-md"
                            disabled={b.loadingServices}
                        >
                            <option value="">Select service…</option>
                            {b.services.map((s) => (
                                <option key={s.service_id} value={s.service_id}>
                                    {s.service_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingServices && <p className="text-xs text-gray-500 mt-1">Loading services…</p>}
                        {b.servicesError && <p className="text-xs text-red-400 mt-1">{b.servicesError}</p>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Brand</label>
                        <select
                            value={b.brandId}
                            onChange={(e) => b.setBrandId(e.target.value)}
                            className="w-full p-2 bg-black/40 border border-rf-border rounded-md"
                            disabled={!b.serviceId || b.loadingBrands}
                        >
                            <option value="">{b.serviceId ? 'All brands / select…' : 'Select service first'}</option>
                            {b.brands.map((x) => (
                                <option key={x.brand_id} value={x.brand_id}>
                                    {x.brand_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingBrands && <p className="text-xs text-gray-500 mt-1">Loading brands…</p>}
                        {b.brandsError && <p className="text-xs text-red-400 mt-1">{b.brandsError}</p>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Product (optional)</label>
                        <select
                            value={b.productId}
                            onChange={(e) => b.setProductId(e.target.value)}
                            className="w-full p-2 bg-black/40 border border-rf-border rounded-md"
                            disabled={!b.serviceId || b.loadingProducts}
                        >
                            <option value="">All products in scope</option>
                            {b.products.map((p) => (
                                <option key={p.product_id} value={p.product_id}>
                                    {p.product_name}
                                </option>
                            ))}
                        </select>
                        {b.loadingProducts && <p className="text-xs text-gray-500 mt-1">Loading products…</p>}
                        {b.productsError && <p className="text-xs text-red-400 mt-1">{b.productsError}</p>}
                    </div>
                </div>

                {!b.brandId && b.serviceId && (
                    <p className="text-sm text-gray-500 mb-3">Select a brand to search live offers.</p>
                )}

                <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium">Offers</h4>
                    {b.brandId && (
                        <button
                            type="button"
                            onClick={() => void b.refreshOffers()}
                            className="text-xs px-2 py-1 bg-black/40 border border-rf-border rounded-md"
                            disabled={b.loadingOffers}
                        >
                            Refresh
                        </button>
                    )}
                </div>
                {b.loadingOffers && <p className="text-sm text-gray-500 mb-2">Loading offers…</p>}
                {b.offersError && <p className="text-sm text-red-400 mb-2">{b.offersError}</p>}

                <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {b.offers.map((o) => (
                        <div key={o.offer_id} className="rf-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <div className="font-medium">{o.title ?? o.offer_id}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Seller: {o.seller_id ?? '—'} · Stock:{' '}
                                    {o.available_qty !== undefined ? o.available_qty : '—'} · {o.status ?? '—'}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-200">
                                    {o.unit_price !== undefined && o.currency
                                        ? `${o.unit_price} ${o.currency}`
                                        : o.unit_price !== undefined
                                          ? String(o.unit_price)
                                          : '—'}
                                </span>
                                <a
                                    href={getG2GOfferExternalUrl(o.offer_id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-rf-red text-black rounded-md text-sm"
                                >
                                    View / Buy on G2G
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {b.brandId && !b.loadingOffers && !b.offersError && b.offers.length === 0 && (
                    <p className="text-sm text-gray-500">No offers returned for this search.</p>
                )}
            </section>

            <section className="rf-card p-4">
                <h3 className="font-semibold mb-2">Products in scope</h3>
                <p className="text-xs text-gray-500 mb-2">Filtered by selected service and brand (when set).</p>
                <div className="max-h-56 overflow-y-auto space-y-1 text-sm">
                    {b.products.map((p) => (
                        <div key={p.product_id} className="py-1 border-b border-rf-border/50 border-opacity-40">
                            {p.product_name}
                        </div>
                    ))}
                    {!b.loadingProducts && b.serviceId && b.products.length === 0 && (
                        <p className="text-gray-500">No products loaded for this filter.</p>
                    )}
                </div>
            </section>
        </div>
    )
}
