"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthButtons() {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleContinue() {
        const value = identifier.trim();
        if (!value) return;
        setLoading(true);
        setError(null);
        const result = await signIn("credentials", {
            identifier: value,
            redirect: false,
        });
        setLoading(false);
        if (result?.error) {
            setError("Could not sign in. Check your email or phone and try again.");
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">

            {/* ── Credentials ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                <input
                    type="text"
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && handleContinue()}
                    placeholder="Email or phone number"
                    autoComplete="username"
                    className="w-full rounded-md border border-rf-border bg-rf-bgSoft/70 px-4 py-2.5 text-sm text-rf-text placeholder-white/30 outline-none transition focus:border-rf-red focus:ring-1 focus:ring-rf-red"
                />
                {error && (
                    <p className="text-xs text-rf-red/80">{error}</p>
                )}
                <button
                    onClick={handleContinue}
                    disabled={loading || !identifier.trim()}
                    className="w-full rounded-md bg-rf-red px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-rf-red/40 transition hover:bg-rf-redSoft disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    {loading ? "Signing in…" : "Continue"}
                </button>
            </div>

            {/* ── Divider ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-rf-border" />
                <span className="text-xs text-white/25 uppercase tracking-widest">or</span>
                <span className="h-px flex-1 bg-rf-border" />
            </div>

            {/* ── OAuth ────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                    onClick={() => signIn("discord")}
                    className="inline-flex w-full items-center justify-center rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-2.5 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white sm:w-auto"
                >
                    Discord
                </button>
                <button
                    onClick={() => signIn("google")}
                    className="inline-flex w-full items-center justify-center rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-2.5 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white sm:w-auto"
                >
                    Google
                </button>
            </div>

        </div>
    );
}
