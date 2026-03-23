import bgLogo from '../../assets/images/AR_BasicLogo.png'

/**
 * (site) layout — wraps all non-home app pages.
 * Adds the AR_BasicLogo watermark background.
 * The root layout provides NavBar, Footer, and the base dark gradient.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 bg-center bg-no-repeat bg-contain opacity-[0.04] z-0"
                style={{ backgroundImage: `url(${bgLogo.src})` }}
                aria-hidden="true"
            />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
