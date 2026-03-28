'use client'

/**
 * MapFieldGuide.tsx
 *
 * Client component — renders the below-map field guide on map detail pages.
 * Requires 'use client' for collapsible section state and scroll behaviour.
 *
 * Information hierarchy:
 *   1. Field Status        — ALWAYS VISIBLE  — live data (MetaForge · ARDB · local)
 *   2. Recommended Focus   — ALWAYS VISIBLE  — curated callout
 *   ── Intel Nav ──────────────────────────────────────────────────────────────
 *   3. Tactical Hotspots   — COLLAPSIBLE     — curated named locations
 *   4. What to Expect      — COLLAPSIBLE     — curated editorial paragraph
 *   5. Tactical Notes      — COLLAPSIBLE     — curated bullet list
 *   ── Attribution ────────────────────────────────────────────────────────────
 *
 * STICKY NAV
 *   The Intel Nav strip uses `position: sticky` anchored at `top-[56px]`
 *   (just below the fixed navbar). This requires removing `overflow-hidden`
 *   from the outer card div — otherwise the nearest scrolling ancestor
 *   would be the card itself, which doesn't scroll, and sticky would not work.
 *   The header retains `rounded-t-2xl overflow-hidden` to clip its background
 *   to the card's rounded corners.
 *
 * SECTION ANCHORS
 *   IDs: guide-hotspots · guide-overview · guide-notes
 *   Each section carries `scroll-mt-[104px]` to clear the stacked
 *   fixed navbar (~56px) + sticky Intel Nav (~40px) + breathing room.
 *
 * AUTO-EXPAND ON NAV CLICK
 *   Clicking a nav item expands the section if collapsed, then uses
 *   requestAnimationFrame to scroll after React commits the DOM update.
 *
 * Returns null if no guide exists for the map.
 */

import { useState, type Dispatch, type SetStateAction } from 'react'
import type { MapGuide } from '@/lib/maps/mapGuideContent'

// ── Module-level helpers ──────────────────────────────────────────────────────

/**
 * Expand a section (if collapsed) then smooth-scroll to its anchor.
 * requestAnimationFrame ensures React has committed the DOM update
 * before the scroll fires, so the element is at its new position.
 */
function navTo(
  id:      string,
  isOpen:  boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  if (!isOpen) setOpen(true)
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

// ── Internal components ───────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={`w-3 h-3 text-white/18 shrink-0 transition-transform duration-200 ease-in-out ${
        open ? 'rotate-0' : '-rotate-90'
      }`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

type CollapsibleSectionProps = {
  /** Stable DOM id for scroll anchoring. */
  sectionId?: string
  label:      string
  icon?:      React.ReactNode
  open:       boolean
  onToggle:   () => void
  children:   React.ReactNode
}

function CollapsibleSection({
  sectionId,
  label,
  icon,
  open,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    /*
     * scroll-mt-[104px]: clears fixed navbar (~56px) + sticky Intel Nav (~40px)
     * + breathing room when this element is a scrollIntoView target.
     */
    <section id={sectionId} className="scroll-mt-[104px]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center justify-between w-full
                   -mx-1 px-1 py-0.5 rounded
                   group hover:bg-white/[0.025] active:bg-white/[0.035]
                   transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] uppercase tracking-widest font-semibold
                           text-white/30 group-hover:text-white/45
                           transition-colors duration-150">
            {label}
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* CSS grid-template-rows collapse — no JS height calculation */}
      <div
        style={{
          display:          'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition:       'grid-template-rows 0.18s ease',
        }}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  guide:               MapGuide | null
  mapName:             string
  questCount:          number
  questsWithPosition:  number
  containerCount:      number
  hasEvents:           boolean
  activeConditions:    string[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapFieldGuide({
  guide,
  mapName,
  questCount,
  questsWithPosition,
  containerCount,
  hasEvents,
  activeConditions,
}: Props) {
  if (!guide) return null

  const [hotspotsOpen, setHotspotsOpen] = useState(true)
  const [expectOpen,   setExpectOpen]   = useState(true)
  const [notesOpen,    setNotesOpen]    = useState(true)

  const hasPartialPositions = questsWithPosition > 0 && questsWithPosition < questCount
  const hasHotspots         = guide.hotspots && guide.hotspots.length > 0

  // Nav items — used to render the sticky jump strip
  const navItems: Array<{
    id:      string
    label:   string
    open:    boolean
    setOpen: Dispatch<SetStateAction<boolean>>
  }> = [
    ...(hasHotspots
      ? [{ id: 'guide-hotspots', label: 'Hotspots', open: hotspotsOpen, setOpen: setHotspotsOpen }]
      : []),
    { id: 'guide-overview', label: 'Overview', open: expectOpen, setOpen: setExpectOpen },
    { id: 'guide-notes',    label: 'Notes',    open: notesOpen,  setOpen: setNotesOpen  },
  ]

  return (
    /*
     * overflow-hidden intentionally removed here so that position:sticky on
     * the Intel Nav strip works relative to the page scroll container.
     * The card header uses rounded-t-2xl overflow-hidden instead.
     */
    <div className="rf-card rounded-2xl">

      {/* ── Card header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5
                      border-b border-white/5 bg-white/[0.02]
                      rounded-t-2xl overflow-hidden">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth={1.5} stroke="currentColor"
               className="w-3.5 h-3.5 text-white/30 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
            Field Guide
          </span>
        </div>
        <span className="text-[10px] text-white/20 border border-white/8
                         rounded-full px-2 py-0.5 shrink-0">
          {mapName}
        </span>
      </div>

      <div className="p-5 space-y-5">

        {/* ── 1. Field Status — always visible ─────────────────────────── */}
        <section
          className="rounded-xl border border-white/6 bg-white/[0.025] px-4 py-3.5"
          aria-label="Live field status"
        >
          <h3 className="text-[9px] uppercase tracking-widest text-white/22 font-semibold mb-3">
            Field Status
          </h3>
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">

            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/20 font-medium">
                Conditions
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  hasEvents ? 'bg-rf-red animate-pulse' : 'bg-rf-green/55'
                }`} />
                <span className={`text-[11px] font-semibold truncate ${
                  hasEvents ? 'text-rf-red/80' : 'text-rf-green/65'
                }`}>
                  {hasEvents ? (activeConditions[0] ?? 'Active Event') : 'Nominal'}
                </span>
              </div>
              {hasEvents && activeConditions.length > 1 && (
                <span className="text-[9px] text-white/25">
                  +{activeConditions.length - 1} more
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/20 font-medium">
                Quest Intel
              </span>
              {questCount > 0 ? (
                <>
                  <span className="text-[11px] font-semibold text-rf-blue/70">
                    {questCount} {questCount === 1 ? 'quest' : 'quests'}
                  </span>
                  {hasPartialPositions && (
                    <span className="text-[9px] text-white/25">
                      {questsWithPosition} placed on map
                    </span>
                  )}
                  {!hasPartialPositions && questsWithPosition === questCount && questCount > 0 && (
                    <span className="text-[9px] text-white/25">All positioned</span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-white/25">No data</span>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-white/20 font-medium">
                Containers
              </span>
              <span className={`text-[11px] font-semibold ${
                containerCount > 0 ? 'text-rf-yellow/65' : 'text-white/22'
              }`}>
                {containerCount > 0 ? `${containerCount} mapped` : 'None yet'}
              </span>
            </div>

          </div>
        </section>

        {/* ── 2. Recommended Focus — always visible ────────────────────── */}
        <section
          className="border-l-2 border-rf-red/35 pl-4 space-y-2.5"
          aria-label="Recommended focus"
        >
          <div>
            <span className="text-[9px] uppercase tracking-widest text-rf-red/40 font-semibold">
              Best For
            </span>
            <p className="mt-0.5 text-[13px] font-medium text-white/75 leading-snug">
              {guide.bestFor}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-white/22 font-semibold">
              Recommended Focus
            </span>
            <p className="mt-0.5 text-sm text-rf-textSoft leading-relaxed">
              {guide.recommendedFocus}
            </p>
          </div>
        </section>

        {/* ── Intel Nav — sticky jump strip ────────────────────────────── */}
        {/*
         * sticky top-[56px]: sticks just below the fixed navbar.
         * -mx-5 px-4: bleeds to card edges despite the parent's p-5 padding.
         * z-[8]: above the z-[6] page content, well below the navbar z-50.
         * border-y replaces the h-px dividers that previously surrounded this zone.
         */}
        <div
          className="sticky top-[56px] z-[8] -mx-5 px-4 py-2
                     border-y border-white/[0.045]
                     bg-[rgba(9,12,20,0.93)] backdrop-blur-md"
          aria-label="Field guide navigation"
        >
          <div className="flex items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/18
                             font-semibold pr-2.5 shrink-0 select-none">
              Jump
            </span>
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => navTo(item.id, item.open, item.setOpen)}
                className="text-[10px] font-semibold uppercase tracking-widest
                           text-white/32 hover:text-white/65
                           px-2.5 py-1 rounded-full
                           hover:bg-white/[0.07] active:bg-white/[0.12]
                           transition-all duration-150"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Tactical Hotspots — collapsible ───────────────────────── */}
        {hasHotspots && (
          <>
            <CollapsibleSection
              sectionId="guide-hotspots"
              label="Tactical Hotspots"
              open={hotspotsOpen}
              onToggle={() => setHotspotsOpen(v => !v)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     strokeWidth={1.5} stroke="currentColor"
                     className="w-3 h-3 text-white/25 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              }
            >
              <ul className="divide-y divide-white/[0.045]">
                {guide.hotspots!.map((spot, i) => (
                  <li key={i} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span
                      className="text-rf-red/30 shrink-0 select-none mt-px"
                      style={{ fontSize: '9px', lineHeight: '1.6' }}
                      aria-hidden="true"
                    >
                      ◈
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/60 leading-none mb-1">
                        {spot.name}
                      </p>
                      <p className="text-xs text-rf-textSoft leading-relaxed">
                        {spot.summary}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
            <div className="h-px bg-white/5" />
          </>
        )}

        {/* ── 4. What to Expect — collapsible ──────────────────────────── */}
        <CollapsibleSection
          sectionId="guide-overview"
          label="What to Expect"
          open={expectOpen}
          onToggle={() => setExpectOpen(v => !v)}
        >
          <p className="text-sm text-rf-textSoft leading-relaxed">
            {guide.whatToExpect}
          </p>
        </CollapsibleSection>

        <div className="h-px bg-white/5" />

        {/* ── 5. Tactical Notes — collapsible ──────────────────────────── */}
        <CollapsibleSection
          sectionId="guide-notes"
          label="Tactical Notes"
          open={notesOpen}
          onToggle={() => setNotesOpen(v => !v)}
        >
          <ul className="space-y-2.5">
            {guide.tacticalNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-rf-red/40 text-xs mt-0.5 shrink-0 select-none">▸</span>
                <span className="text-sm text-rf-textSoft leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* ── Attribution ──────────────────────────────────────────────── */}
        <p className="text-[10px] text-white/13 leading-relaxed pt-1 border-t border-white/5">
          Guide content is curated editorial.
          {' '}Quest data via ardb.app · Conditions via MetaForge.
        </p>

      </div>
    </div>
  )
}
