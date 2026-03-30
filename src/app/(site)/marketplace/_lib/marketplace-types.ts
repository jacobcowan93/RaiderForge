export type MarketplaceTabId = 'buy' | 'sell'

export type ListingStatus = 'active' | 'sold' | 'cancelled'

export type OrderStatus =
    | 'pending'
    | 'awaiting_payment'
    | 'paid'
    | 'awaiting_delivery'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'disputed'

export type OrderRole = 'buyer' | 'seller'

export type OrderDisplayField = { label: string; value: string }
