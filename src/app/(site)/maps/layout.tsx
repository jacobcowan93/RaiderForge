/**
 * Maps section layout — full-viewport background from /public plus a 30% black tint.
 *
 * Stack (low → high):
 *   - Fixed `z-0`: hero image (cover, center) — url('/images/ARC_Black_White_Logo.jpg')
 *   - Fixed `z-[1]`: `bg-black/30` tint for readability
 *   - `relative z-10`: page content above both layers
 *
 * Parent `(site)` layout uses `relative z-10` for all section children; this subtree
 * stays above the site watermark because the entire maps branch lives inside that layer.
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <div
                className="pointer-events-none fixed inset-0 z-0 bg-rf-bg bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/ARC_Black_White_Logo.jpg')" }}
                aria-hidden="true"
            />
            <div
                className="pointer-events-none fixed inset-0 z-[1] bg-black/30"
                aria-hidden="true"
            />
            <div className="relative z-10">{children}</div>
        </div>
    )
}
