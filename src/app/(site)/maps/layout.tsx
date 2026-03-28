import arcBg from '@/assets/images/ARC_Blueprint_Background.jpg'

/**
 * Maps section layout — full-bleed background, no dark tint overlay.
 *
 * Stacking context notes:
 *   - Site layout watermark: fixed, z-0 in root stacking context
 *   - Site layout content wrapper: relative z-10 (creates stacking context)
 *   - This background: fixed z-[5] inside the z-10 context → paints above the
 *     watermark, below all page content (which sits at z-[6])
 *   - NavBar (fixed z-50 in root) is unaffected — always above everything here
 *
 * Readability is handled by rf-card glassmorphism on cards and text-shadow-hero
 * on the floating header, not by darkening the background.
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 z-[5] bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${arcBg.src})` }}
                aria-hidden="true"
            />
            <div className="relative z-[6]">
                {children}
            </div>
        </div>
    )
}
