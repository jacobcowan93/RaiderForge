"use client";

import { signIn } from "next-auth/react";

export function AuthButtons() {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
                onClick={() => signIn("discord")}
                className="inline-flex w-full items-center justify-center rounded-md bg-rf-red px-5 py-3 text-sm font-medium text-white shadow-lg shadow-rf-red/40 transition hover:bg-rf-redSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-red focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto"
            >
                Sign in with Discord
            </button>
            <button
                onClick={() => signIn("google")}
                className="inline-flex w-full items-center justify-center rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-3 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white sm:w-auto"
            >
                Sign in with Google
            </button>
            <button
                onClick={() => signIn("email")}
                className="inline-flex w-full items-center justify-center rounded-md border border-rf-border bg-rf-bgSoft/70 px-5 py-3 text-sm font-medium text-rf-text transition hover:border-rf-red hover:text-white sm:w-auto"
            >
                Sign in with Email
            </button>
        </div>
    );
}