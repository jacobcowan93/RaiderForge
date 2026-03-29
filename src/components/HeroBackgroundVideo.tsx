'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
    /** Poster / first frame fallback */
    poster: string
    /** MP4 path under public/ */
    src: string
}

/**
 * Full-bleed hero background video with mobile-safe autoplay (muted + playsInline)
 * and a tap-to-play overlay when the browser blocks autoplay.
 */
export function HeroBackgroundVideo({ poster, src }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [showTapToPlay, setShowTapToPlay] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const tryPlay = () => {
            const playPromise = video.play()
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setShowTapToPlay(true)
                })
            }
        }

        if (video.readyState >= 2) tryPlay()
        else video.addEventListener('loadeddata', tryPlay, { once: true })

        const onPlaying = () => {
            setShowTapToPlay(false)
        }
        video.addEventListener('playing', onPlaying)

        return () => {
            video.removeEventListener('loadeddata', tryPlay)
            video.removeEventListener('playing', onPlaying)
        }
    }, [])

    const handleTapPlay = () => {
        const video = videoRef.current
        if (!video) return
        video.muted = true
        const p = video.play()
        if (p !== undefined) {
            p.then(() => setShowTapToPlay(false)).catch(() => {
                /* still blocked — keep overlay */
            })
        }
    }

    return (
        <>
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    ref={videoRef}
                    src={src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    poster={poster}
                    controlsList="nodownload"
                    disablePictureInPicture
                    className="absolute inset-0 z-0 h-full w-full object-cover"
                />
                <div
                    className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-transparent to-rf-bg"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-t from-rf-red/8 to-transparent"
                    aria-hidden
                />
            </div>

            {/* Sibling above hero copy (z-10) so tap works when autoplay is blocked */}
            {showTapToPlay && (
                <button
                    type="button"
                    onClick={handleTapPlay}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/45 px-6 text-center backdrop-blur-[2px] transition-opacity"
                    aria-label="Play background video"
                >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 text-white shadow-lg shadow-black/40">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="ml-1 h-8 w-8"
                            aria-hidden
                        >
                            <path d="M8 5v14l11-7L8 5z" />
                        </svg>
                    </span>
                    <span className="max-w-xs text-sm font-semibold tracking-wide text-white">
                        Tap to play background video
                    </span>
                </button>
            )}
        </>
    )
}
