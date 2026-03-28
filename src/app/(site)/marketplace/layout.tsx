/**
 * Marketplace section — same full-viewport background as Maps (skill tree art + light tint).
 */
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 z-[5] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/ARC_Raiders_Main_SkillTree.png')" }}
                aria-hidden="true"
            />
            <div className="pointer-events-none fixed inset-0 z-[5] bg-black/20" aria-hidden="true" />
            <div className="relative z-[6]">{children}</div>
        </div>
    )
}
