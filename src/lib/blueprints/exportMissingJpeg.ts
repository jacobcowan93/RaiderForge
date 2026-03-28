import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { applyBlueprintSort, type SortMode } from '@/lib/blueprints/sortBlueprints'

const BG = '#05060a'
const TEXT = '#f3f4f6'
const MUTED = '#9ca3af'
const JPEG_QUALITY = 0.9
const W = 1000
const PAD = 48
const ROW_GAP = 16
const IMG_SIZE = 72

function loadImageCors(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('image load failed'))
        img.src = src
    })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let line = ''
    for (const w of words) {
        const next = line ? `${line} ${w}` : w
        if (ctx.measureText(next).width <= maxWidth) line = next
        else {
            if (line) lines.push(line)
            line = w
        }
    }
    if (line) lines.push(line)
    return lines.slice(0, 6)
}

/**
 * Renders missing blueprints to a JPEG (solid background). Tries CORS-safe images; skips on failure.
 */
export async function exportMissingBlueprintsAsJpeg(
    missing: NormalizedBlueprint[],
    sortMode: SortMode = 'rarity_desc'
): Promise<void> {
    if (typeof document === 'undefined') return
    const sorted = applyBlueprintSort(missing, sortMode)
    if (sorted.length === 0) {
        window.alert('No missing blueprints to export.')
        return
    }

    const canvas = document.createElement('canvas')
    canvas.width = W
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, 4000)

    let y = PAD
    ctx.fillStyle = TEXT
    ctx.font = 'bold 28px system-ui, sans-serif'
    ctx.fillText('Missing Blueprints', PAD, y)
    y += 44
    ctx.fillStyle = MUTED
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillText(`${sorted.length} items`, PAD, y)
    y += 36

    const textXBase = PAD + IMG_SIZE + 20
    const maxTextW = W - textXBase - PAD

    for (const b of sorted) {
        const imgUrl = b.imageUrl ?? b.iconUrl
        let drawnImg = false
        if (imgUrl) {
            try {
                const img = await loadImageCors(imgUrl)
                const h = img.naturalHeight || img.height
                const w = img.naturalWidth || img.width
                const scale = Math.min(IMG_SIZE / w, IMG_SIZE / h, 1)
                const dw = w * scale
                const dh = h * scale
                const ox = PAD + (IMG_SIZE - dw) / 2
                const oy = y + (IMG_SIZE - dh) / 2
                ctx.fillStyle = 'rgba(255,255,255,0.04)'
                ctx.fillRect(PAD, y, IMG_SIZE, IMG_SIZE)
                ctx.drawImage(img, ox, oy, dw, dh)
                drawnImg = true
            } catch {
                /* CORS or load failure — text only */
            }
        }
        if (!drawnImg) {
            ctx.fillStyle = 'rgba(255,255,255,0.06)'
            ctx.fillRect(PAD, y, IMG_SIZE, IMG_SIZE)
            ctx.fillStyle = MUTED
            ctx.font = '11px system-ui, sans-serif'
            ctx.fillText('No img', PAD + 12, y + IMG_SIZE / 2)
        }

        ctx.fillStyle = TEXT
        ctx.font = '600 17px system-ui, sans-serif'
        ctx.fillText(b.name, textXBase, y + 22)

        const rare = b.rarity?.trim()
        ctx.fillStyle = MUTED
        ctx.font = '13px system-ui, sans-serif'
        ctx.fillText(rare ? `Rarity: ${rare}` : 'Rarity: —', textXBase, y + 44)

        let descY = y + 66
        if (b.description?.trim()) {
            ctx.font = '13px system-ui, sans-serif'
            const lines = wrapText(ctx, b.description.trim(), maxTextW)
            for (const line of lines) {
                ctx.fillText(line, textXBase, descY)
                descY += 18
            }
        }

        y += Math.max(IMG_SIZE, descY - y + 8) + ROW_GAP
    }

    const finalH = Math.ceil(y + PAD)
    const out = document.createElement('canvas')
    out.width = W
    out.height = finalH
    const octx = out.getContext('2d')
    if (!octx) return
    octx.fillStyle = BG
    octx.fillRect(0, 0, W, finalH)
    octx.drawImage(canvas, 0, 0)

    await new Promise<void>((resolve, reject) => {
        out.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('toBlob failed'))
                    return
                }
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `missing-blueprints-${new Date().toISOString().slice(0, 10)}.jpg`
                a.click()
                URL.revokeObjectURL(url)
                resolve()
            },
            'image/jpeg',
            JPEG_QUALITY
        )
    })
}
