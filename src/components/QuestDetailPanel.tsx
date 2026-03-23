'use client'

/**
 * QuestDetailPanel.tsx
 *
 * Slide-in overlay panel rendered inside the map container when a quest
 * marker is clicked. Positioned absolute right-0 top-0 over the tile viewer.
 *
 * Shows: trader icon + name, quest name, maps chips, objectives, required
 * items with icons + amounts, reward items with icons + quantities.
 *
 * All data comes from the MergedQuest object — no additional API calls.
 * Image icons: ARDB static CDN (required items, trader) + MetaForge CDN (rewards).
 */

import type { MergedQuest } from '../types/quests'

// ── Rarity → accent color ─────────────────────────────────────────────────────
// Rarity strings come directly from ARDB/MetaForge — lowercase expected.
const RARITY_CLASSES: Record<string, string> = {
  common:    'text-white/55',
  uncommon:  'text-rf-green',
  rare:      'text-rf-blue',
  epic:      'text-rf-yellow',
  legendary: 'text-rf-orange',
  exotic:    'text-rf-red',
}
function rarityClass(rarity: string | undefined): string {
  return RARITY_CLASSES[rarity?.toLowerCase() ?? ''] ?? 'text-white/55'
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  quest: MergedQuest
  onClose: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuestDetailPanel({ quest, onClose }: Props) {
  return (
    <div
      className="absolute top-0 right-0 h-full w-64 flex flex-col z-[1000] overflow-hidden"
      style={{
        background: 'rgba(5, 6, 10, 0.93)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
      }}
      // Prevent map clicks from propagating through the panel
      onClick={e => e.stopPropagation()}
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 px-4 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">

        {/* Trader icon */}
        {quest.traderIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={quest.traderIcon}
            alt={quest.traderName}
            className="w-7 h-7 rounded-full border border-white/15 flex-shrink-0 object-cover mt-0.5"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex-shrink-0" />
        )}

        {/* Quest name + trader */}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-widest text-white/30 leading-none mb-1">
            {quest.traderName}
          </p>
          <h3 className="text-[13px] font-bold text-white leading-snug">{quest.name}</h3>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close quest panel"
          className="flex-shrink-0 text-white/25 hover:text-white/65 transition-colors mt-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

        {/* Maps */}
        {quest.maps.length > 0 && (
          <Section label="Zones">
            <div className="flex flex-wrap gap-1">
              {quest.maps.map(m => (
                <span
                  key={m.id}
                  className="text-[10px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-white/40"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Objectives */}
        {quest.steps.length > 0 && (
          <Section label="Objectives">
            <div className="space-y-1.5">
              {quest.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-white/60 leading-snug">
                  <span className="text-white/20 flex-shrink-0 mt-[1px] font-bold text-[10px]">{i + 1}.</span>
                  <span>{step.title}{step.amount ? <> <span className="text-white/35">×{step.amount}</span></> : null}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Required items */}
        {quest.requiredItems.length > 0 && (
          <Section label="Required Items">
            <div className="space-y-2">
              {quest.requiredItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="w-7 h-7 rounded border border-white/10 flex-shrink-0 object-contain bg-white/3"
                    loading="lazy"
                  />
                  <span className={`text-[11px] flex-1 min-w-0 truncate leading-tight ${rarityClass(item.rarity)}`}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-white/30 flex-shrink-0 font-medium">
                    ×{item.amount}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rewards */}
        {quest.rewards.length > 0 ? (
          <Section label="Rewards">
            <div className="space-y-2">
              {quest.rewards.map((reward, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reward.icon}
                    alt={reward.name}
                    className="w-7 h-7 rounded border border-white/10 flex-shrink-0 object-contain bg-white/3"
                    loading="lazy"
                  />
                  <span className={`text-[11px] flex-1 min-w-0 truncate leading-tight ${rarityClass(reward.rarity)}`}>
                    {reward.name}
                  </span>
                  <span className="text-[10px] text-white/30 flex-shrink-0 font-medium">
                    ×{reward.quantity}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <p className="text-[10px] text-white/20 leading-relaxed">
            Reward data not yet available for this quest.
          </p>
        )}

      </div>

      {/* ── Footer attribution ────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-white/[0.05] flex-shrink-0">
        <p className="text-[9px] text-white/15">via MetaForge &amp; ardb.app</p>
      </div>

    </div>
  )
}

// ── Section label helper ──────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5 font-semibold">
        {label}
      </p>
      {children}
    </div>
  )
}
