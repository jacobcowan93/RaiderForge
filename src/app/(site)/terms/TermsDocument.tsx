import Link from 'next/link'

export function TermsDocument() {
    return (
        <article className="space-y-10">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Use / User Agreement</h1>
                <p className="text-sm text-rf-textSoft">Last updated: March 28, 2026</p>
            </header>

            <div className="space-y-4 text-rf-textSoft leading-relaxed">
                <p>
                    These Terms of Use (&quot;Terms&quot;) govern your access to and use of raiderforge.org and all
                    associated features, tools, and services (collectively, the &quot;Services&quot;), including the blueprint
                    tracker, raider profile sync, marketplace, Trials tools, and any other functionality.
                </p>
                <p>
                    By accessing, registering for, or using the Services, you agree to these Terms. If you do not agree, do
                    not use the Services.
                </p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Eligibility</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    You must be at least 13 years old (or the minimum age required to consent to these Terms and any
                    applicable data processing in your jurisdiction) and have the legal capacity to enter into a binding
                    agreement. By using the Services, you represent and warrant that you meet these requirements.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">
                    Account Registration and Security
                </h2>
                <p className="text-rf-textSoft leading-relaxed">
                    Certain features (e.g., blueprint tracking, profile sync, marketplace) require an account. You are
                    responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>Providing accurate information during registration.</li>
                    <li>Maintaining the confidentiality of your credentials.</li>
                    <li>All activities that occur under your account.</li>
                </ul>
                <p className="text-rf-textSoft leading-relaxed">
                    Notify us immediately of any unauthorized access or security breach. We reserve the right to suspend or
                    terminate accounts for violations of these Terms or suspected security risks.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">No Official Affiliation</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    RaiderForge is an independent, unofficial, fan-made project operated by Jacob Cowan. It is not affiliated
                    with, endorsed by, or sponsored by Embark Studios AB, ARC Raiders, or any of their affiliates. All
                    game-related names, logos, assets, and trademarks belong to their respective owners and are used here for
                    informational/reference purposes only (e.g., fair use in commentary or tools).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Acceptable Use</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    You agree to use the Services only for lawful purposes and in compliance with these Terms. You will not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>
                        Violate any applicable law, regulation, or third-party rights (including Embark Studios&apos; terms of
                        service for ARC Raiders).
                    </li>
                    <li>Harass, threaten, or abuse other users.</li>
                    <li>Attempt unauthorized access to accounts, systems, or data.</li>
                    <li>
                        Reverse engineer, scrape, data-mine, or extract content in ways that violate our terms or third-party
                        restrictions (including any limits on maps.tcno.co/arc).
                    </li>
                    <li>Upload or distribute malware, spam, illegal content, or material that infringes intellectual property.</li>
                    <li>Use the Services to cheat, exploit, or interfere with ARC Raiders gameplay, servers, or other players.</li>
                    <li>Engage in real-money trading or transactions that violate ARC Raiders&apos; rules.</li>
                </ul>
                <p className="text-rf-textSoft leading-relaxed">
                    We may monitor usage and suspend or terminate access for violations.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">
                    Game Data, Blueprint Tracker, and Raider Profile Sync
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>
                        Features like the blueprint tracker and profile sync allow you to input, store, or sync ARC
                        Raiders-related data (blueprints, inventory, stats, Trials progress, etc.).
                    </li>
                    <li>You are solely responsible for the accuracy and legality of any identifiers or data you provide.</li>
                    <li>
                        Data is provided for informational and planning purposes only. It may not always be accurate, complete,
                        or up-to-date with in-game states.
                    </li>
                    <li>When using third-party integrations or APIs, you must comply with those providers&apos; terms.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Marketplace and Transactions</h2>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>The marketplace tools let users list items, make offers, plan trades, or track activity.</li>
                    <li>
                        RaiderForge acts only as a platform for information and facilitation. We are not a broker, escrow
                        service, payment processor, or party to any user-to-user trades.
                    </li>
                    <li>
                        All trades, sales, or agreements occur directly between users (in-game or otherwise). You are solely
                        responsible for fulfilling agreements and resolving disputes.
                    </li>
                    <li>
                        We are not liable for any losses, fraud, non-delivery, or disagreements arising from marketplace
                        interactions.
                    </li>
                    <li>
                        You may not use the Services for illegal activities or real-money trading that violates ARC Raiders&apos;
                        terms or applicable law.
                    </li>
                    <li>If third-party payment processing is added later, separate terms will apply.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">
                    Third-Party Services
                </h2>
                <p className="text-rf-textSoft leading-relaxed">
                    RaiderForge integrates with or links to third-party services including MetaForge and external data
                    providers. Your use of those services is subject to their own terms. We are not responsible for the
                    accuracy, availability, or functionality of third-party services.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">User Content</h2>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>
                        You may submit content such as feedback, custom builds, comments, screenshots, or listings (&quot;User
                        Content&quot;).
                    </li>
                    <li>You retain ownership of your User Content.</li>
                    <li>
                        You grant us a worldwide, non-exclusive, royalty-free, perpetual license to host, display, reproduce,
                        modify (as needed for formatting), and distribute your User Content solely to operate and improve the
                        Services.
                    </li>
                    <li>
                        You represent that your User Content does not infringe third-party rights and complies with these Terms.
                    </li>
                    <li>We may remove or moderate User Content that violates these Terms.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Intellectual Property</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    All original RaiderForge code, designs, logos, and content (excluding ARC Raiders assets and third-party
                    material) are owned by Jacob Cowan or his licensors and protected by copyright and other laws. You may not
                    copy, modify, distribute, or create derivative works without prior written consent, except as permitted by
                    law.
                </p>
                <p className="text-rf-textSoft leading-relaxed">ARC Raiders content remains the property of Embark Studios AB.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Disclaimers</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    The Services are provided &quot;as is&quot; and &quot;as available&quot; without any warranties (express or
                    implied), including accuracy, reliability, or fitness for a particular purpose. We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-rf-textSoft leading-relaxed">
                    <li>The Services will be uninterrupted, error-free, or secure.</li>
                    <li>Game data, builds, maps, or strategies will produce specific in-game results.</li>
                    <li>Third-party maps or synced data will always be current.</li>
                </ul>
                <p className="text-rf-textSoft leading-relaxed">Your use is at your own risk.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Limitation of Liability</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    To the fullest extent permitted by law, RaiderForge and its contributors (including Jacob Cowan) shall not
                    be liable for any indirect, incidental, consequential, special, or punitive damages (including loss of
                    data, profits, or goodwill) arising from your use of (or inability to use) the Services. Our total
                    liability will not exceed the amount you paid us (if any) in the 12 months before the claim.
                </p>
                <p className="text-rf-textSoft leading-relaxed">
                    Some jurisdictions do not allow these limitations, so they may not apply to you.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Indemnification</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    You agree to indemnify and hold harmless Jacob Cowan, RaiderForge, and its contributors from any claims,
                    losses, liabilities, damages, and expenses (including reasonable attorneys&apos; fees) arising from your
                    use of the Services, violation of these Terms, or infringement of third-party rights.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">
                    Changes to the Services or Terms
                </h2>
                <p className="text-rf-textSoft leading-relaxed">
                    We may modify, suspend, or discontinue any part of the Services at any time. We may also update these Terms.
                    Material changes will be posted with a new &quot;Last updated&quot; date. Continued use after changes
                    constitutes acceptance.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">
                    Governing Law and Dispute Resolution
                </h2>
                <p className="text-rf-textSoft leading-relaxed">
                    These Terms are governed by the laws of the State of Arkansas, USA, without regard to conflict of laws
                    principles. Any disputes shall be resolved exclusively in the state or federal courts located in Arkansas.
                    You agree to submit to the personal jurisdiction of those courts.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Miscellaneous</h2>
                <p className="text-rf-textSoft leading-relaxed">
                    These Terms, together with the{' '}
                    <Link href="/privacy" className="text-rf-blue hover:underline">
                        Privacy Policy
                    </Link>
                    , constitute the entire agreement. If any provision is invalid, the remainder remains enforceable. Our
                    failure to enforce a right does not waive it.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-white border-b border-rf-border/60 pb-2">Contact</h2>
                <p className="text-rf-textSoft leading-relaxed">Questions about these Terms? Contact:</p>
                <p className="text-rf-textSoft leading-relaxed">
                    Jacob Cowan
                    <br />
                    RaiderForge
                    <br />
                    Email:{' '}
                    <a href="mailto:jacobcowanr@gmail.com" className="text-rf-blue hover:underline">
                        jacobcowanr@gmail.com
                    </a>
                </p>
            </section>
        </article>
    )
}
