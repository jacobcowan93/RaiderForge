'use client'

import Image from 'next/image'
import { encodeLocalPublicPath } from '@/lib/maps/mapCovers'

type Props = {
    src: string
    alt: string
    /** Parent must be `relative` with bounded size. */
    fill?: boolean
    width?: number
    height?: number
    sizes?: string
    className?: string
    priority?: boolean
}

/**
 * Zone cover / preview: uses `next/image` for same-origin `/…` assets; plain `<img>` for remote URLs (no remotePatterns).
 */
export function MapCoverImage({
    src,
    alt,
    fill,
    width = 800,
    height = 500,
    sizes,
    className = '',
    priority,
}: Props) {
    const isLocal = src.startsWith('/')
    const resolvedSrc = isLocal ? encodeLocalPublicPath(src) : src
    const cls = className.includes('object-') ? className : `object-cover ${className}`.trim()

    if (isLocal) {
        if (fill) {
            return (
                <Image
                    src={resolvedSrc}
                    alt={alt}
                    fill
                    sizes={sizes ?? '100vw'}
                    className={cls}
                    priority={priority}
                />
            )
        }
        return (
            <Image
                src={resolvedSrc}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                className={cls}
                priority={priority}
            />
        )
    }

    if (fill) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- remote CDN / game-data URLs
            <img src={resolvedSrc} alt={alt} className={`absolute inset-0 h-full w-full ${cls}`} />
        )
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolvedSrc} alt={alt} width={width} height={height} className={cls} />
    )
}
