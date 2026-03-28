import React from 'react'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'

export default function BuildsPage() {
    return (
        <div className="py-8 px-4 sm:px-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold text-white">Builds — loadout hub</h1>
                <PageMaturityBadge level="in-development" />
            </div>
            <h2 className="text-lg font-semibold text-white/80 mb-4">MetaForge skill tree embed</h2>
            <p className="text-gray-300 mb-4">This page will embed MetaForge's official skill tree editor when available.</p>

            {/* If MetaForge provides an embed URL, replace src with the real embed and pass query params as needed. */}
            <div className="rf-card p-4">
                <div className="mb-4">Embedded Skill Tree (mock)</div>
                <div className="border rounded-md p-6 bg-black/40 text-gray-300">MetaForge editor iframe will go here (iframe src TODO).</div>
            </div>

            <section className="mt-6">
                <h3 className="font-semibold mb-2">Saved Builds</h3>
                <ul className="text-sm text-gray-300">
                    <li>Test Build Alpha (meta-build-id: mf-123)</li>
                    <li>Test Build Beta (meta-build-id: mf-456)</li>
                </ul>
            </section>
        </div>
    )
}
