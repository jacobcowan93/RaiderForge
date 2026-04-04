import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/LegalPageShell'
import { TermsDocument } from './TermsDocument'

export const metadata: Metadata = {
    title: 'Terms of Use — Community Toolkit Rules & Disclaimers',
    description: 'RaiderForge terms of use: community guidelines, marketplace rules, disclaimer of affiliation with Embark Studios, and your rights as a user.',
    alternates: { canonical: 'https://raiderforge.org/terms' },
    robots: { index: true, follow: false },
}

export default function TermsPage() {
    return (
        <LegalPageShell>
            <TermsDocument />
        </LegalPageShell>
    )
}
