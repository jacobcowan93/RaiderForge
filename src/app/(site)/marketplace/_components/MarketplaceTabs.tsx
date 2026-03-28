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
        <div className="flex border-b border-white/[0.08] gap-1">
            {MARKETPLACE_TABS.map(({ id, label }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange(id)}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === id
                            ? 'text-rf-text'
                            : 'text-rf-textSoft/60 hover:text-rf-textSoft'
                    }`}
                >
                    {label}
                    {activeTab === id && (
                        <span className="absolute bottom-0 inset-x-0 h-[2px] bg-rf-red rounded-t-full" />
                    )}
                </button>
            ))}
        </div>
    )
}
