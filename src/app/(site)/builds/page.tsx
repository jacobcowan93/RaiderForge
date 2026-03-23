import React from 'react'

export default function BuildsPage() {
    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Builds — MetaForge Skill Tree</h2>
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
