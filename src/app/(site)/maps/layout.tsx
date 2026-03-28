/**
 * Maps section layout — full-area background from /public plus a 50% black overlay.
 * Content sits in `relative z-10` above image + tint.
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/images/ARC_Marketplace.jpg')" }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10">{children}</div>
        </div>
    )
}
