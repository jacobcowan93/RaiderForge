import { GuideRoute } from '../api/metaforgeClient'

export const exampleGuides: GuideRoute[] = [
    {
        id: 'guide-early-1',
        title: 'Quick Blueprint Run (Early Game)',
        difficulty: 'easy',
        description: 'Fast loop that focuses on common blueprint drops',
        waypoints: [{ name: 'Spawn' }, { name: 'Lost Cache' }]
    },
    {
        id: 'guide-farm-1',
        title: 'High-value Loot Route',
        difficulty: 'medium',
        description: 'Targets high-value spawns and repeatable events',
        waypoints: [{ name: 'Steelworks' }, { name: 'Warden Arena' }]
    }
]
