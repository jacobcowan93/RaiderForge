/**
 * Maps section layout — full-viewport skill tree art (`public/images/ARC_Raiders_Main_SkillTree.png`)
 * plus a light uniform tint (~20% black) so copy and cards stay readable.
 *
 * Stacking context notes:
 *   - Site layout watermark: fixed, z-0 in root stacking context
 *   - Site layout content wrapper: relative z-10 (creates stacking context)
 *   - Background image + tint: fixed z-[5] inside the z-10 context → above watermark,
 *     below all page content (z-[6])
 *   - NavBar (fixed z-50 in root) is unaffected — always above everything here
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 z-[5] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/ARC_Raiders_Main_SkillTree.png')" }}
                aria-hidden="true"
            />
            <div
                className="pointer-events-none fixed inset-0 z-[5] bg-black/20"
                aria-hidden="true"
            />
            <div className="relative z-[6]">
                {children}
            </div>
        </div>
    )
}
