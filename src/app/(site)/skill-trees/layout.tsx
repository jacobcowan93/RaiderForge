import type { Metadata } from 'next'
import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

export const metadata: Metadata = {
    title: 'Skill Tree Planner',
    description:
        'Plan and share ARC Raiders skill tree builds. Allocate expedition points across Conditioning, Mobility, and Survival — then share your build with a link.',
    openGraph: {
        title: 'ARC Raiders Skill Tree Planner • RaiderForge',
        description:
            'Build and share ARC Raiders skill trees. Allocate points across Conditioning, Mobility, and Survival and share your build with a link.',
    },
}

/**
 * Skill Trees section layout — the actual ARC Raiders skill tree art as a
 * full-viewport background.  Inverted + heavily dimmed so it reads on the
 * dark site theme.  The art shows the fan topology users see in-game.
 */
export default function SkillTreesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-[100dvh]">
            {/* Background: in-game skill tree art — dark source image, dimmed further */}
            <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
                <Image
                    src={normalizePublicAssetUrl('/images/ARC_Raiders_Main_SkillTree.png')}
                    alt=""
                    fill
                    className="object-cover object-center"
                    style={{
                        filter:  'brightness(0.35) saturate(0.7)',
                        opacity: 0.95,
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

            {/* Red category accent — Skill Trees identity */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[6] h-[3px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" aria-hidden />
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[6] h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(255,64,64,0.07)_0%,transparent_100%)]" aria-hidden />

            {/* Page content above the background */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
