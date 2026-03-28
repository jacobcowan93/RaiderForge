import type { GameItem } from '../types'
import { asNumber, asString, pickLocalized } from './common'
import { resolveGameDataImageUrl } from './imageUrl'

function pickItemType(r: Record<string, unknown>): string | null {
    return (
        asString(r.type) ??
        asString(r.itemType) ??
        asString(r.item_type) ??
        asString(r.category) ??
        asString(r.itemCategory) ??
        asString(r.item_category)
    )
}

function pickRarity(r: Record<string, unknown>): string | null {
    const s =
        asString(r.rarity) ??
        asString(r.rarityTier) ??
        asString(r.rarity_tier) ??
        asString(r.tier)
    return s ? s.toLowerCase() : null
}

function nestedImageCandidates(obj: Record<string, unknown>): string[] {
    const details = obj.details
    if (!details || typeof details !== 'object' || Array.isArray(details)) return []
    const d = details as Record<string, unknown>
    const out: string[] = []
    for (const k of [
        'imageFilename',
        'image_filename',
        'imageUrl',
        'image_url',
        'icon',
        'iconUrl',
        'icon_url',
        'thumbnail',
    ]) {
        const v = d[k]
        if (typeof v === 'string' && v.trim()) out.push(v.trim())
    }
    if (typeof d.image === 'string' && d.image.trim()) out.push(d.image.trim())
    return out
}

function itemImageCandidates(r: Record<string, unknown>): string[] {
    const out: string[] = []
    const push = (v: unknown) => {
        if (typeof v === 'string' && v.trim()) out.push(v.trim())
    }
    push(r.imageFilename)
    push(r.image_filename)
    push(r.icon)
    push(r.iconUrl)
    push(r.icon_url)
    push(r.thumbnail)
    push(r.thumbUrl)
    push(r.thumb_url)
    push(r.imageUrl)
    push(r.image_url)
    if (typeof r.image === 'string') push(r.image)
    else if (r.image && typeof r.image === 'object' && !Array.isArray(r.image)) {
        const im = r.image as Record<string, unknown>
        push(im.url)
        push(im.src)
    }
    out.push(...nestedImageCandidates(r))
    return out
}

export function normalizeGameItem(raw: unknown): GameItem | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    const name = pickLocalized(r.name, id)
    return {
        id,
        name,
        description: pickLocalized(r.description, '') || null,
        type: pickItemType(r),
        rarity: pickRarity(r),
        value: asNumber(r.value),
        weightKg: asNumber(r.weightKg ?? r.weight_kg),
        stackSize: asNumber(r.stackSize ?? r.stack_size),
        imageUrl: resolveGameDataImageUrl(itemImageCandidates(r)),
        updatedAt: asString(r.updatedAt ?? r.updated_at),
    }
}
