/** Matches Marketplace / Blueprints tactical inputs with red focus ring. */
export const inputCls =
    'w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-rf-text ' +
    'placeholder:text-rf-textSoft/40 focus-visible:border-rf-red/40 focus-visible:ring-2 ' +
    'focus-visible:ring-rf-red/[0.12] outline-none transition-colors ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

export const selectCls = `${inputCls} cursor-pointer`

export const btnSave =
    'inline-flex w-full items-center justify-center rounded-lg border-2 border-rf-red/45 bg-rf-red/12 ' +
    'px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-rf-red hover:bg-rf-red/20 ' +
    'hover:border-rf-red/60 transition-colors disabled:opacity-40 disabled:pointer-events-none'

export const btnGhost =
    'inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-rf-bg/80 ' +
    'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rf-text hover:border-rf-red/35 ' +
    'hover:bg-white/5 transition-colors'
