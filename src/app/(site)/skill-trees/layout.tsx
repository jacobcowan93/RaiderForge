import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

/**
 * Skill Trees section layout — the actual ARC Raiders skill tree art as a
 * full-viewport background.  Inverted + heavily dimmed so it reads on the
 * dark site theme.  The art shows the fan topology users see in-game.
 */
export default function SkillTreesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-[100dvh]">
            {/* Background: in-game skill tree art, inverted for dark mode */}
            <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
                <Image
                    src={normalizePublicAssetUrl('/images/ARC_Skilltree.png')}
                    alt=""
                    fill
                    className="object-cover object-center"
                    style={{
                        filter:   'invert(1) brightness(0.12) saturate(0)',
                        opacity:  0.85,
                    }}
                    priority
                    sizes="100vw"
                />
                {/* gradient fade at top and bottom edges */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(7,9,13,0.55) 0%, transparent 18%, transparent 78%, rgba(7,9,13,0.75) 100%)',
                    }}
                />
            </div>

            {/* Page content above the background */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
