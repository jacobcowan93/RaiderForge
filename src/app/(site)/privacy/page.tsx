import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { PrivacyDocument } from './PrivacyDocument'

export const metadata: Metadata = {
    title: 'Privacy Policy | Raider Forge',
    description: 'How RaiderForge collects, uses, and protects your information.',
}

export default function PrivacyPage() {
    return (
        <LegalPageShell>
            <PrivacyDocument />
        </LegalPageShell>
    )
}
