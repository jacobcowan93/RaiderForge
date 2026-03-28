'use client'

import type { TrialProgressChecklistItem } from '@/data/trials'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

type Props = {
    trialId: string
    items: TrialProgressChecklistItem[]
}

export function TrialProgressChecklist({ trialId, items }: Props) {
    const { hydrated, getTrialChecklist, toggleTrialChecklistItem } = useLearningProgress()

    if (!hydrated || items.length === 0) return null

    const map = getTrialChecklist(trialId)

    return (
        <div
            className="rounded-lg border border-white/[0.06] bg-black/30 p-4"
            role="group"
            aria-label="Trial prep checklist (local only)"
        >
            <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-3">Prep checklist</p>
            <ul className="space-y-2 list-none p-0 m-0">
                {items.map((item) => {
                    const done = Boolean(map[item.id])
                    return (
                        <li key={item.id}>
                            <label className="flex items-start gap-2 cursor-pointer text-sm text-white/70 hover:text-white/85">
                                <input
                                    type="checkbox"
                                    checked={done}
                                    onChange={() => toggleTrialChecklistItem(trialId, item.id)}
                                    className="mt-1 rounded border-white/20 bg-black/40 text-rf-red focus:ring-red-500/40"
                                    aria-label={`${item.label}${done ? ', checked' : ', unchecked'}`}
                                />
                                <span className={done ? 'line-through text-white/45' : ''}>{item.label}</span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
