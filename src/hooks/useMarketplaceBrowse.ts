'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
    fetchMarketplaceBrands,
    fetchMarketplaceProducts,
    fetchMarketplaceServices,
    searchMarketplaceOffers,
    type MarketplaceResult,
    type MarketplaceRouteError
} from '@/lib/marketplace/browse-api'

type ServiceRow = { service_id: string; service_name: string }
type BrandRow = { brand_id: string; brand_name: string }
type ProductRow = {
    product_id: string
    product_name: string
    brand_id?: string
    service_id?: string
    brand_name?: string
}
type OfferRow = {
    offer_id: string
    seller_id?: string
    title?: string
    currency?: string
    unit_price?: number
    available_qty?: number
    status?: string
}

function pickServices(payload: unknown): ServiceRow[] {
    if (!payload || typeof payload !== 'object') return []
    const list = (payload as { service_list?: unknown }).service_list
    if (!Array.isArray(list)) return []
    return list
        .filter((x): x is ServiceRow => !!x && typeof x === 'object' && typeof (x as ServiceRow).service_id === 'string')
        .map((x) => ({
            service_id: x.service_id,
            service_name: typeof x.service_name === 'string' ? x.service_name : x.service_id
        }))
}

function pickBrands(payload: unknown): BrandRow[] {
    if (!payload || typeof payload !== 'object') return []
    const list = (payload as { brand_list?: unknown }).brand_list
    if (!Array.isArray(list)) return []
    return list
        .filter((x): x is BrandRow => !!x && typeof x === 'object' && typeof (x as BrandRow).brand_id === 'string')
        .map((x) => ({
            brand_id: x.brand_id,
            brand_name: typeof x.brand_name === 'string' ? x.brand_name : x.brand_id
        }))
}

function pickProducts(payload: unknown): ProductRow[] {
    if (!payload || typeof payload !== 'object') return []
    const list = (payload as { product_list?: unknown }).product_list
    if (!Array.isArray(list)) return []
    return list.filter(
        (x): x is ProductRow =>
            !!x && typeof x === 'object' && typeof (x as ProductRow).product_id === 'string'
    ) as ProductRow[]
}

function pickOffers(payload: unknown): OfferRow[] {
    if (!payload || typeof payload !== 'object') return []
    const list = (payload as { results?: unknown }).results
    if (!Array.isArray(list)) return []
    return list.filter(
        (x): x is OfferRow => !!x && typeof x === 'object' && typeof (x as OfferRow).offer_id === 'string'
    ) as OfferRow[]
}

function errMessage(r: MarketplaceResult<unknown>): string {
    if (r.ok) return ''
    const e = r as MarketplaceRouteError
    if (e.error === 'g2g_not_configured' && e.missingKeys?.length)
        return `G2G not configured (${e.missingKeys.length} key(s) missing)`
    return e.error || 'Request failed'
}

export function useMarketplaceBrowse() {
    const [services, setServices] = useState<ServiceRow[]>([])
    const [brands, setBrands] = useState<BrandRow[]>([])
    const [products, setProducts] = useState<ProductRow[]>([])
    const [offers, setOffers] = useState<OfferRow[]>([])

    const [serviceId, setServiceId] = useState('')
    const [brandId, setBrandId] = useState('')
    const [productId, setProductId] = useState('')

    const [loadingServices, setLoadingServices] = useState(true)
    const [loadingBrands, setLoadingBrands] = useState(false)
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [loadingOffers, setLoadingOffers] = useState(false)

    const [servicesError, setServicesError] = useState<string | null>(null)
    const [brandsError, setBrandsError] = useState<string | null>(null)
    const [productsError, setProductsError] = useState<string | null>(null)
    const [offersError, setOffersError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoadingServices(true)
            setServicesError(null)
            const r = await fetchMarketplaceServices()
            if (cancelled) return
            if (!r.ok) setServicesError(errMessage(r))
            else setServices(pickServices(r.payload))
            setLoadingServices(false)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!serviceId) {
            setBrands([])
            setBrandId('')
            setLoadingBrands(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoadingBrands(true)
            setBrandsError(null)
            const r = await fetchMarketplaceBrands(serviceId)
            if (cancelled) return
            if (!r.ok) {
                setBrandsError(errMessage(r))
                setBrands([])
            } else {
                setBrands(pickBrands(r.payload))
            }
            setLoadingBrands(false)
        })()
        return () => {
            cancelled = true
        }
    }, [serviceId])

    useEffect(() => {
        if (!serviceId) {
            setProducts([])
            setProductId('')
            setLoadingProducts(false)
            return
        }
        let cancelled = false
        ;(async () => {
            setLoadingProducts(true)
            setProductsError(null)
            const r = await fetchMarketplaceProducts({
                service_id: serviceId,
                ...(brandId ? { brand_id: brandId } : {})
            })
            if (cancelled) return
            if (!r.ok) {
                setProductsError(errMessage(r))
                setProducts([])
            } else {
                setProducts(pickProducts(r.payload))
            }
            setLoadingProducts(false)
        })()
        return () => {
            cancelled = true
        }
    }, [serviceId, brandId])

    const selectedProduct = useMemo(
        () => products.find((p) => p.product_id === productId) ?? null,
        [products, productId]
    )

    const refreshOffers = useCallback(async () => {
        if (!brandId) {
            setOffers([])
            setOffersError(null)
            return
        }
        setLoadingOffers(true)
        setOffersError(null)
        const filter: Record<string, unknown> = {
            brand_id: brandId,
            status: 'live'
        }
        if (selectedProduct?.product_name) {
            filter.query = selectedProduct.product_name
        }
        const r = await searchMarketplaceOffers({
            filter,
            page_size: 30,
            page: 1
        })
        if (!r.ok) {
            setOffersError(errMessage(r))
            setOffers([])
        } else {
            setOffers(pickOffers(r.payload))
        }
        setLoadingOffers(false)
    }, [brandId, selectedProduct])

    useEffect(() => {
        if (!brandId) {
            setOffers([])
            setOffersError(null)
            return
        }
        void refreshOffers()
    }, [brandId, productId, refreshOffers])

    const onServiceChange = (id: string) => {
        setServiceId(id)
        setBrandId('')
        setProductId('')
    }

    const onBrandChange = (id: string) => {
        setBrandId(id)
        setProductId('')
    }

    return {
        services,
        brands,
        products,
        offers,
        serviceId,
        brandId,
        productId,
        setServiceId: onServiceChange,
        setBrandId: onBrandChange,
        setProductId,
        loadingServices,
        loadingBrands,
        loadingProducts,
        loadingOffers,
        servicesError,
        brandsError,
        productsError,
        offersError,
        refreshOffers
    }
}
