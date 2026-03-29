/**
 * skillTreeLayout.ts
 *
 * Explicit (x, y) canvas coordinates for every skill node in the ARC Raiders
 * three-branch fan layout.  Positions are derived from the in-game skill tree
 * art (ARC_Skilltree.png) then scaled to a 1100 × 600 logical pixel canvas.
 *
 * Branch geometry:
 *   • Conditioning — fans ~23° left of vertical, root at bottom-left of cluster
 *   • Mobility     — fans straight up from the centre
 *   • Survival     — mirrors Conditioning, ~23° right of vertical
 *
 * All three roots converge near the bottom centre of the canvas, matching the
 * expedition-terminal focal point visible in the in-game UI.
 */

// ── Canvas dimensions ─────────────────────────────────────────────────────────

export const CANVAS_W = 1100
export const CANVAS_H = 600

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NodeLayout {
    /** Globally-unique node ID: "{Branch}_{id}" */
    uid:          string
    /** Logical canvas X coordinate (0 = left edge) */
    x:            number
    /** Logical canvas Y coordinate (0 = top edge) */
    y:            number
    /** Which side of the node the tooltip opens toward */
    tooltipSide:  'above' | 'below'
    /** Horizontal alignment of the tooltip relative to the node */
    tooltipAlign: 'left' | 'center' | 'right'
}

export interface Connector {
    from: string   // fromUid
    to:   string   // toUid
}

// ── Tooltip helpers ───────────────────────────────────────────────────────────
// Nodes near the bottom show tooltip above; nodes near the edges align outward.

function side(y: number):  'above' | 'below'            { return y > CANVAS_H * 0.72 ? 'above' : 'below' }
function align(x: number): 'left' | 'center' | 'right' {
    if (x < CANVAS_W * 0.22) return 'left'
    if (x > CANVAS_W * 0.78) return 'right'
    return 'center'
}
function nl(uid: string, x: number, y: number): NodeLayout {
    return { uid, x, y, tooltipSide: side(y), tooltipAlign: align(x) }
}

// ── Node positions ────────────────────────────────────────────────────────────
// Coordinates were derived from the source image (ARC_Skilltree.png) then
// uniformly scaled to the 1100 × 600 logical canvas.
//
// Naming convention:  {Branch}_{tier}{col}
//   tier: 1=root … 7=capstone
//   col:  l=left · c=centre · r=right  (tier 1 has no suffix)

export const NODE_LAYOUTS: NodeLayout[] = [

    // ── CONDITIONING  (root bottom-left, fans upper-left) ─────────────────────
    nl('Conditioning_1',   308, 528),

    nl('Conditioning_2l',  226, 485),
    nl('Conditioning_2r',  323, 444),

    nl('Conditioning_3l',  192, 420),
    nl('Conditioning_3r',  290, 380),

    nl('Conditioning_4l',  159, 356),
    nl('Conditioning_4r',  256, 315),

    nl('Conditioning_5l',  125, 291),
    nl('Conditioning_5c',  174, 271),
    nl('Conditioning_5r',  222, 251),

    nl('Conditioning_6l',   92, 227),
    nl('Conditioning_6c',  141, 207),
    nl('Conditioning_6r',  188, 187),

    nl('Conditioning_7l',   57, 163),
    nl('Conditioning_7r',  155, 122),

    // ── MOBILITY  (root bottom-centre, fans straight up) ──────────────────────
    nl('Mobility_1',   550, 528),

    nl('Mobility_2l',  489, 457),
    nl('Mobility_2r',  611, 457),

    nl('Mobility_3l',  489, 386),
    nl('Mobility_3r',  611, 386),

    nl('Mobility_4l',  489, 315),
    nl('Mobility_4r',  611, 315),

    nl('Mobility_5l',  489, 244),
    nl('Mobility_5c',  550, 244),
    nl('Mobility_5r',  611, 244),

    nl('Mobility_6l',  489, 173),
    nl('Mobility_6c',  550, 173),
    nl('Mobility_6r',  611, 173),

    nl('Mobility_7l',  489, 103),
    nl('Mobility_7r',  611, 103),

    // ── SURVIVAL  (root bottom-right, fans upper-right — mirrors Conditioning) ─
    nl('Survival_1',   792, 528),

    nl('Survival_2l',  777, 444),
    nl('Survival_2r',  874, 485),

    nl('Survival_3l',  810, 380),
    nl('Survival_3r',  908, 420),

    nl('Survival_4l',  844, 315),
    nl('Survival_4r',  941, 356),

    nl('Survival_5l',  878, 251),
    nl('Survival_5c',  926, 271),
    nl('Survival_5r',  975, 291),

    nl('Survival_6l',  911, 187),
    nl('Survival_6c',  960, 207),
    nl('Survival_6r', 1008, 227),

    nl('Survival_7l',  945, 122),
    nl('Survival_7r', 1042, 163),
]

// ── Connectors ────────────────────────────────────────────────────────────────
// Generated from TREE_EDGES × BRANCHES.  Each entry is one SVG line.

const RAW_EDGES: [string, string][] = [
    ['1',  '2l'],
    ['1',  '2r'],
    ['2l', '3l'],
    ['2r', '3r'],
    ['3l', '4l'],
    ['3r', '4r'],
    ['4l', '5l'],
    ['4l', '5c'],
    ['4r', '5c'],
    ['4r', '5r'],
    ['5l', '6l'],
    ['5c', '6c'],
    ['5r', '6r'],
    ['6l', '7l'],
    ['6c', '7l'],
    ['6c', '7r'],
    ['6r', '7r'],
]

const LAYOUT_BRANCHES = ['Conditioning', 'Mobility', 'Survival'] as const

export const CONNECTORS: Connector[] = LAYOUT_BRANCHES.flatMap((branch) =>
    RAW_EDGES.map(([f, t]) => ({
        from: `${branch}_${f}`,
        to:   `${branch}_${t}`,
    }))
)

// ── Lookup map ────────────────────────────────────────────────────────────────

export const NODE_LAYOUT_MAP: Map<string, NodeLayout> = new Map(
    NODE_LAYOUTS.map((n) => [n.uid, n])
)
