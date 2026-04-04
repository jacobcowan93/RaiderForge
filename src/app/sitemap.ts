import type { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site/siteOrigin'
import { GUIDE_ARTICLES } from '@/data/guides'

export default function sitemap(): MetadataRoute.Sitemap {
    const origin = getSiteOrigin()
    const now    = new Date()

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: origin,                          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
        { url: `${origin}/blueprints`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
        { url: `${origin}/marketplace`,         lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
        { url: `${origin}/skill-trees`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${origin}/skill-trees/builder`, lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${origin}/trials`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
        { url: `${origin}/guides`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
        { url: `${origin}/quests`,              lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${origin}/traders`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${origin}/loadouts`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${origin}/sync`,                lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${origin}/profile`,             lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${origin}/privacy`,             lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
        { url: `${origin}/terms`,               lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    ]

    const guideRoutes: MetadataRoute.Sitemap = GUIDE_ARTICLES.map((g) => ({
        url:             `${origin}/guides/${g.slug}`,
        lastModified:    now,
        changeFrequency: 'monthly' as const,
        priority:        0.6,
    }))

    return [...staticRoutes, ...guideRoutes]
}
