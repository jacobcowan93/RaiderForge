import SignInForm from "./SignInForm"
import { getSignInUiFlags } from "@/lib/auth/signin-flags"

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; error?: string; intent?: string }>
}) {
    const params = await searchParams
    const flags = getSignInUiFlags()

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16">
            <div className="w-full max-w-md rounded-xl border border-rf-border bg-rf-bgSoft/40 p-8 shadow-xl shadow-black/40">
                <h1 className="text-2xl font-bold text-white text-center mb-2">Sign in to RaiderForge</h1>
                <p className="text-sm text-rf-textSoft text-center mb-8">
                    Choose a provider to continue. OAuth uses your existing account; email sends a one-time link.
                </p>
                <SignInForm
                    flags={flags}
                    callbackUrl={params.callbackUrl}
                    error={params.error}
                    initialIntent={params.intent}
                />
            </div>
        </div>
    )
}
