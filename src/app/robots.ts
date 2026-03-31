import type { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

export default function robots(): MetadataRoute.Robots {
    const origin = getSiteOrigin()
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/auth/', '/admin/'],
            },
        ],
        sitemap: `${origin}/sitemap.xml`,
    }
}
