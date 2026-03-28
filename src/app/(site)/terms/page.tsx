import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { TermsDocument } from './TermsDocument'

export const metadata: Metadata = {
    title: 'Terms of Use | Raider Forge',
    description: 'Terms governing your use of RaiderForge.',
}

export default function TermsPage() {
    return (
        <LegalPageShell>
            <TermsDocument />
        </LegalPageShell>
    )
}
