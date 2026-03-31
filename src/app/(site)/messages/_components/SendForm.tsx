'use client'

import { useRef, useState, type KeyboardEvent } from 'react'

export function SendForm({
    onSend,
    disabled,
}: {
    onSend: (body: string) => Promise<void>
    disabled?: boolean
}) {
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const ref = useRef<HTMLTextAreaElement>(null)

    async function handleSend() {
        const trimmed = text.trim()
        if (!trimmed || sending || disabled) return
        setSending(true)
        setText('')
        await onSend(trimmed)
        setSending(false)
        ref.current?.focus()
    }

    function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex items-end gap-2 p-3 border-t border-white/[0.07]">
            <textarea
                ref={ref}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                maxLength={2000}
                disabled={disabled || sending}
                className="flex-1 resize-none rounded-xl bg-white/[0.06] border border-white/[0.10] text-sm text-white/90 placeholder:text-white/30 px-3 py-2.5 focus:outline-none focus:border-yellow-400/50 focus:bg-white/[0.08] transition-colors min-h-[40px] max-h-[120px] overflow-y-auto"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || sending || disabled}
                className="shrink-0 h-10 w-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                    <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                </svg>
            </button>
        </div>
    )
}
