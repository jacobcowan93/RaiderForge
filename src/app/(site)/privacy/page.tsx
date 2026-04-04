import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { PrivacyDocument } from './PrivacyDocument'

export const metadata: Metadata = {
    title: 'Privacy Policy — How We Handle Your Data',
    description: 'RaiderForge privacy policy: what data we collect, how we use it, your rights, and how to contact us. We never sell your data.',
    alternates: { canonical: 'https://raiderforge.org/privacy' },
    robots: { index: true, follow: false },
}

export default function PrivacyPage() {
    return (
        <LegalPageShell>
            <PrivacyDocument />
        </LegalPageShell>
    )
}
