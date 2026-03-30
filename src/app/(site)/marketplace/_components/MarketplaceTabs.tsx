import type { MarketplaceTabId } from '../_lib/marketplace-types'
import { MARKETPLACE_TABS } from '../_lib/marketplace-constants'

export function MarketplaceTabs({
    activeTab,
    onTabChange,
}: {
    activeTab: MarketplaceTabId
    onTabChange: (tab: MarketplaceTabId) => void
}) {
    return (
        <div className="flex border-b border-white/[0.15] gap-1">
            {MARKETPLACE_TABS.map(({ id, label }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange(id)}
                    className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === id
                            ? 'text-white'
                            : 'text-white/50 hover:text-white/80'
                    }`}
                >
                    {label}
                    {activeTab === id && (
                        <span className="absolute bottom-0 inset-x-0 h-[2px] bg-yellow-400 rounded-t-full" />
                    )}
                </button>
            ))}
        </div>
    )
}
