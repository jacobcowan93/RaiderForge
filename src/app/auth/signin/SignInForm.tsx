"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { signIn } from "next-auth/react"

type UiFlags = {
    google: boolean
    discord: boolean
    emailMagicLink: boolean
}

type EmailIntent = "signin" | "signup"

function sanitizeCallbackUrl(raw: string | undefined): string {
    if (!raw || typeof raw !== "string") return "/"
    const t = raw.trim()
    if (!t.startsWith("/") || t.startsWith("//")) return "/"
    return t
}

export default function SignInForm({
    flags,
    callbackUrl: callbackUrlProp,
    error: errorCode,
    initialIntent,
}: {
    flags: UiFlags
    callbackUrl?: string
    error?: string
    initialIntent?: string
}) {
    const callbackUrl = useMemo(() => sanitizeCallbackUrl(callbackUrlProp), [callbackUrlProp])

    const [email, setEmail] = useState("")
    const [emailIntent, setEmailIntent] = useState<EmailIntent>(
        initialIntent === "signup" ? "signup" : "signin"
    )
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const anyOAuth = flags.google || flags.discord
    const configured = anyOAuth || flags.emailMagicLink

    const errorMessage = useMemo(() => {
        if (errorCode === "Configuration") {
            return "Sign-in is misconfigured on the server. Check environment variables."
        }
        if (errorCode === "AccessDenied") {
            return "Access was denied. Try again or use a different sign-in method."
        }
        if (errorCode) {
            return "Sign-in failed. Try again."
        }
        return null
    }, [errorCode])

    async function sendMagicLink() {
        const value = email.trim().toLowerCase()
        if (!value) return
        setLoading(true)
        setFormError(null)
        const result = await signIn("email", {
            email: value,
            callbackUrl,
            redirect: true,
        })
        setLoading(false)
        if (result?.error) {
            setFormError(
                "Could not send the sign-in email. Confirm your address and that email sign-in is enabled on the server."
            )
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            {errorMessage && (
                <p className="text-sm text-rf-red/90 text-center px-2">{errorMessage}</p>
            )}

            {!configured && (
                <p className="text-sm text-rf-textSoft text-center">
                    No sign-in methods are configured. Set OAuth credentials and/or database plus email
                    (see <code className="text-white/60">.env.example</code>) to enable sign-in.
                </p>
            )}

            {anyOAuth && (
                <div className="flex flex-col gap-2">
                    {flags.google && (
                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl })}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-2.5 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white"
                        >
                            Sign in with Google
                        </button>
                    )}
                    {flags.discord && (
                        <button
                            type="button"
                            onClick={() => signIn("discord", { callbackUrl })}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-2.5 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white"
                        >
                            Sign in with Discord
                        </button>
                    )}
                </div>
            )}

            {anyOAuth && flags.emailMagicLink && (
                <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-rf-border" />
                    <span className="text-xs text-white/25 uppercase tracking-widest">or</span>
                    <span className="h-px flex-1 bg-rf-border" />
                </div>
            )}

            {flags.emailMagicLink && (
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-rf-textSoft text-center leading-relaxed">
                        Email sign-in uses a magic link (no password). The same link signs you in whether you
                        already have an account or you are new—we create your account when you open the email link.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEmailIntent("signin")
                                setFormError(null)
                            }}
                            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                                emailIntent === "signin"
                                    ? "border-rf-red bg-rf-red/15 text-white"
                                    : "border-rf-border bg-rf-bgSoft/50 text-rf-textSoft hover:border-rf-border hover:text-rf-text"
                            }`}
                        >
                            Sign in with Email
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEmailIntent("signup")
                                setFormError(null)
                            }}
                            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                                emailIntent === "signup"
                                    ? "border-rf-red bg-rf-red/15 text-white"
                                    : "border-rf-border bg-rf-bgSoft/50 text-rf-textSoft hover:border-rf-border hover:text-rf-text"
                            }`}
                        >
                            Sign up with Email
                        </button>
                    </div>

                    <p className="text-[11px] text-white/35 text-center">
                        {emailIntent === "signup"
                            ? "Enter your email to receive a link and create your account."
                            : "Enter your email to receive a sign-in link."}
                    </p>

                    <input
                        type="email"
                        value={email}
                        onChange={e => {
                            setEmail(e.target.value)
                            setFormError(null)
                        }}
                        onKeyDown={e => e.key === "Enter" && sendMagicLink()}
                        placeholder="Email"
                        autoComplete="email"
                        className="w-full rounded-md border border-rf-border bg-rf-bgSoft/70 px-4 py-2.5 text-sm text-rf-text placeholder-white/30 outline-none transition focus:border-rf-red focus:ring-1 focus:ring-rf-red"
                    />
                    {formError && <p className="text-xs text-rf-red/80">{formError}</p>}
                    <button
                        type="button"
                        onClick={() => void sendMagicLink()}
                        disabled={loading || !email.trim()}
                        className="w-full rounded-md bg-rf-red px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-rf-red/40 transition hover:bg-rf-redSoft disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                        {loading ? "Sending link…" : "Send magic link"}
                    </button>
                </div>
            )}

            {!flags.emailMagicLink && configured && (
                <p className="text-xs text-rf-textSoft text-center leading-relaxed">
                    Email magic link is not enabled. Add <code className="text-white/50">DATABASE_URL</code> and SMTP
                    settings from <code className="text-white/50">.env.example</code> to turn it on.
                </p>
            )}

            {configured && (
                <p className="text-center text-[11px] leading-relaxed text-white/45">
                    By continuing, you agree to the{" "}
                    <Link
                        href="/terms"
                        className="text-rf-textSoft/90 hover:text-rf-blue hover:underline underline-offset-2 transition-colors"
                    >
                        Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="text-rf-textSoft/90 hover:text-rf-blue hover:underline underline-offset-2 transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            )}
        </div>
    )
}
