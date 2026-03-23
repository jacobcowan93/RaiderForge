// BlueprintTracker.jsx — Missing-blueprints filter, downloadable report, checkbox next to name. Increased font sizes for readability.
import { useEffect, useState, useRef, useMemo } from "react";
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import { getDropForBlueprint } from "../shared/data/blueprint_drops";
import blueprintBg from "../assets/ARC_Blueprint_Background.jpg";
import MissingBlueprintsReport from "./components/MissingBlueprintsReport";
import { downloadReportAsImage, downloadReportAsPdf } from "./utils/blueprintReportUtils";
import { useMfBlueprints } from "../api/hooks/useMfBlueprints";
import MetaForgeAttribution from "../api/MetaForgeAttribution";

const RARITY_COLORS = {
  Common:    "rgba(255,255,255,0.45)",
  Uncommon:  "#4fc65a",
  Rare:      "#5a9cf5",
  Epic:      "#a855f7",
  Legendary: "#f97316",
};

const BLUEPRINTS = [
  { id:"angled-grip-ii",           name:"Angled Grip II",              category:"attachment" },
  { id:"angled-grip-iii",          name:"Angled Grip III",             category:"attachment" },
  { id:"anvil",                    name:"Anvil",                       category:"equipment"  },
  { id:"aphelion-rifle",           name:"Aphelion",                    category:"weapon"     },
  { id:"barricade-kit",            name:"Barricade Kit",               category:"equipment"  },
  { id:"bettina",                  name:"Bettina",                     category:"weapon"     },
  { id:"blaze-grenade",            name:"Blaze Grenade",               category:"grenade"    },
  { id:"blue-light-stick",         name:"Blue Light Stick",            category:"misc"       },
  { id:"bobcat",                   name:"Bobcat",                      category:"weapon"     },
  { id:"burletta",                 name:"Burletta",                    category:"weapon"     },
  { id:"combat-mk3-aggressive",    name:"Combat Mk. 3 (Aggressive)",   category:"loadout"    },
  { id:"combat-mk3-flanking",      name:"Combat Mk. 3 (Flanking)",     category:"loadout"    },
  { id:"compensator-i",            name:"Compensator I",                category:"attachment" },
  { id:"compensator-ii",           name:"Compensator II",              category:"attachment" },
  { id:"complex-gun-parts",        name:"Complex Gun Parts",           category:"parts"      },
  { id:"deadline",                 name:"Deadline",                    category:"grenade"    },
  { id:"defibrillator",            name:"Defibrillator",               category:"equipment"  },
  { id:"equalizer",                name:"Equalizer",                   category:"weapon"     },
  { id:"explosive-mine",           name:"Explosive Mine",              category:"grenade"    },
  { id:"extended-barrel",          name:"Extended Barrel",             category:"attachment" },
  { id:"extended-light-mag-ii",    name:"Extended Light Mag II",       category:"attachment" },
  { id:"extended-light-mag-iii",   name:"Extended Light Mag III",      category:"attachment" },
  { id:"extended-medium-mag-ii",   name:"Extended Medium Mag II",      category:"attachment" },
  { id:"extended-medium-mag-iii",  name:"Extended Medium Mag III",     category:"attachment" },
  { id:"extended-shotgun-mag-ii",  name:"Extended Shotgun Mag II",     category:"attachment" },
  { id:"extended-shotgun-mag-iii", name:"Extended Shotgun Mag III",    category:"attachment" },
  { id:"fireworks-box",            name:"Fireworks Box",               category:"misc"       },
  { id:"gas-mine",                 name:"Gas Mine",                    category:"grenade"    },
  { id:"green-light-stick",        name:"Green Light Stick",           category:"misc"       },
  { id:"heavy-gun-parts",          name:"Heavy Gun Parts",             category:"parts"      },
  { id:"hullcracker",              name:"Hullcracker",                 category:"weapon"     },
  { id:"il-toro",                  name:"Il Toro",                     category:"weapon"     },
  { id:"jolt-mine",                name:"Jolt Mine",                   category:"grenade"    },
  { id:"jupiter",                  name:"Jupiter",                     category:"weapon"     },
  { id:"light-gun-parts",          name:"Light Gun Parts",             category:"parts"      },
  { id:"lightweight-stock",        name:"Lightweight Stock",           category:"attachment" },
  { id:"looting-mk3-safekeeper",   name:"Looting Mk. 3 (Safekeeper)", category:"loadout"    },
  { id:"looting-mk3-survivor",     name:"Looting Mk. 3 (Survivor)",   category:"loadout"    },
  { id:"lure-grenade",             name:"Lure Grenade",                category:"grenade"    },
  { id:"medium-gun-parts",         name:"Medium Gun Parts",            category:"parts"      },
  { id:"muzzle-brake-ii",          name:"Muzzle Brake II",             category:"attachment" },
  { id:"muzzle-brake-iii",         name:"Muzzle Brake III",            category:"attachment" },
  { id:"osprey",                   name:"Osprey",                      category:"weapon"     },
  { id:"padded-stock",             name:"Padded Stock",                category:"attachment" },
  { id:"pulse-mine",               name:"Pulse Mine",                  category:"grenade"    },
  { id:"red-light-stick",          name:"Red Light Stick",             category:"misc"       },
  { id:"remote-raider-flare",      name:"Remote Raider Flare",         category:"grenade"    },
  { id:"seeker-grenade",           name:"Seeker Grenade",              category:"grenade"    },
  { id:"shotgun-choke-ii",         name:"Shotgun Choke II",            category:"attachment" },
  { id:"shotgun-choke-iii",        name:"Shotgun Choke III",           category:"attachment" },
  { id:"shotgun-silencer",         name:"Shotgun Silencer",            category:"attachment" },
  { id:"showstopper",              name:"Showstopper",                 category:"weapon"     },
  { id:"silencer-i",               name:"Silencer I",                  category:"attachment" },
  { id:"silencer-ii",              name:"Silencer II",                 category:"attachment" },
  { id:"smoke-grenade",            name:"Smoke Grenade",               category:"grenade"    },
  { id:"snap-hook",                name:"Snap Hook",                   category:"equipment"  },
  { id:"stable-stock-ii",          name:"Stable Stock II",             category:"attachment" },
  { id:"stable-stock-iii",         name:"Stable Stock III",            category:"attachment" },
  { id:"tactical-mk3-defensive",   name:"Tactical Mk. 3 (Defensive)", category:"loadout"    },
  { id:"tactical-mk3-healing",     name:"Tactical Mk. 3 (Healing)",   category:"loadout"    },
  { id:"tactical-mk3-revival",     name:"Tactical Mk. 3 (Revival)",   category:"loadout"    },
  { id:"tagging-grenade",          name:"Tagging Grenade",             category:"grenade"    },
  { id:"tempest",                  name:"Tempest",                     category:"weapon"     },
  { id:"torrente",                 name:"Torrente",                    category:"weapon"     },
  { id:"trailblazer-grenade",      name:"Trailblazer",                  category:"grenade"    },
  { id:"trigger-nade",             name:"Trigger 'Nade",               category:"grenade"    },
  { id:"venator",                  name:"Venator",                     category:"weapon"     },
  { id:"vertical-grip-ii",         name:"Vertical Grip II",            category:"attachment" },
  { id:"vertical-grip-iii",        name:"Vertical Grip III",           category:"attachment" },
  { id:"vita-shot",                name:"Vita Shot",                   category:"equipment"  },
  { id:"vita-spray",               name:"Vita Spray",                  category:"equipment"  },
  { id:"vulcano",                  name:"Vulcano",                     category:"weapon"     },
  { id:"wolfpack",                 name:"Wolfpack",                    category:"weapon"     },
  { id:"yellow-light-stick",       name:"Yellow Light Stick",          category:"misc"       },
];

const BP_IMAGES = {
  "Anvil":"https://arcraiders.wiki/w/images/thumb/0/00/Anvil-Level1.png/120px-Anvil-Level1.png.webp",
  "Aphelion":"https://arcraiders.wiki/w/images/thumb/8/88/Aphelion.png/120px-Aphelion.png.webp",
  "Aphelion Rifle":"https://arcraiders.wiki/w/images/thumb/8/88/Aphelion.png/120px-Aphelion.png.webp",
  "Bettina":"https://arcraiders.wiki/w/images/thumb/a/ac/Bettina.png/120px-Bettina.png.webp",
  "Bobcat":"https://arcraiders.wiki/w/images/thumb/3/36/Bobcat-Level1.png/120px-Bobcat-Level1.png.webp",
  "Burletta":"https://arcraiders.wiki/w/images/thumb/d/d4/Burletta-Level1.png/120px-Burletta-Level1.png.webp",
  "Equalizer":"https://arcraiders.wiki/w/images/thumb/9/96/Equalizer.png/120px-Equalizer.png.webp",
  "Hullcracker":"https://arcraiders.wiki/w/images/thumb/b/ba/Hullcracker-Level1.png/120px-Hullcracker-Level1.png.webp",
  "Il Toro":"https://arcraiders.wiki/w/images/thumb/5/50/Il_Toro-Level1.png/120px-Il_Toro-Level1.png.webp",
  "Jupiter":"https://arcraiders.wiki/w/images/thumb/6/68/Jupiter.png/120px-Jupiter.png.webp",
  "Osprey":"https://arcraiders.wiki/w/images/thumb/a/ae/Osprey-Level1.png/120px-Osprey-Level1.png.webp",
  "Tempest":"https://arcraiders.wiki/w/images/thumb/c/c9/Tempest-Level1.png/120px-Tempest-Level1.png.webp",
  "Torrente":"https://arcraiders.wiki/w/images/thumb/1/1e/Torrente-Level1.png/120px-Torrente-Level1.png.webp",
  "Venator":"https://arcraiders.wiki/w/images/thumb/b/b4/Venator-Level1.png/120px-Venator-Level1.png.webp",
  "Vulcano":"https://arcraiders.wiki/w/images/thumb/d/da/Vulcano-Level1.png/120px-Vulcano-Level1.png.webp",
  "Blaze Grenade":"https://arcraiders.wiki/w/images/thumb/2/24/Blaze_Grenade.png/120px-Blaze_Grenade.png.webp",
  "Gas Mine":"https://arcraiders.wiki/w/images/thumb/c/ce/Gas_Mine.png/120px-Gas_Mine.png.webp",
  "Lure Grenade":"https://arcraiders.wiki/w/images/thumb/7/77/Lure_Grenade.png/120px-Lure_Grenade.png.webp",
  "Pulse Mine":"https://arcraiders.wiki/w/images/thumb/a/af/Pulse_Mine.png/120px-Pulse_Mine.png.webp",
  "Seeker Grenade":"https://arcraiders.wiki/w/images/thumb/3/35/Seeker_Grenade.png/120px-Seeker_Grenade.png.webp",
  "Showstopper":"https://arcraiders.wiki/w/images/thumb/1/18/Showstopper.png/120px-Showstopper.png.webp",
  "Smoke Grenade":"https://arcraiders.wiki/w/images/thumb/d/d5/Smoke_Grenade.png/120px-Smoke_Grenade.png.webp",
  "Tagging Grenade":"https://arcraiders.wiki/w/images/e/e5/Tagging_Grenade.png",
  "Trailblazer Grenade":"https://arcraiders.wiki/w/images/thumb/8/89/Trailblazer.png/120px-Trailblazer.png.webp",
  "Trigger Nade":"https://arcraiders.wiki/w/images/thumb/0/09/Trigger_Nade.png/120px-Trigger_Nade.png.webp",
  "Wolfpack":"https://arcraiders.wiki/w/images/thumb/2/24/Wolfpack.png/120px-Wolfpack.png.webp",
  "Deadline":"https://arcraiders.wiki/w/images/thumb/c/c7/Deadline.png/120px-Deadline.png.webp",
  "Explosive Mine":"https://arcraiders.wiki/w/images/thumb/2/22/Explosive_Mine.png/120px-Explosive_Mine.png.webp",
  "Jolt Mine":"https://arcraiders.wiki/w/images/thumb/5/5a/Jolt_Mine.png/120px-Jolt_Mine.png.webp",
  "Remote Raider Flare":"https://arcraiders.wiki/w/images/thumb/8/89/Trailblazer.png/120px-Trailblazer.png.webp",
  "Combat Mk. 3 (Aggressive)":"https://arcraiders.wiki/w/images/thumb/a/a4/Combat_Mk._3_%28Aggressive%29.png/120px-Combat_Mk._3_%28Aggressive%29.png.webp",
  "Combat MK3 Flanking":"https://arcraiders.wiki/w/images/thumb/7/73/Combat_Mk._3_%28Flanking%29.png/120px-Combat_Mk._3_%28Flanking%29.png.webp",
  "Looting Mk. 3 (Safekeeper)":"https://arcraiders.wiki/w/images/thumb/c/c6/Looting_Mk._3_%28Safekeeper%29.png/120px-Looting_Mk._3_%28Safekeeper%29.png.webp",
  "Looting Mk. 3 (Survivor)":"https://arcraiders.wiki/w/images/thumb/7/74/Looting_Mk._3_%28Survivor%29.png/120px-Looting_Mk._3_%28Survivor%29.png.webp",
  "Tactical Mk. 3 (Revival)":"https://arcraiders.wiki/w/images/thumb/e/e0/Tactical_Mk._3_%28Revival%29.png/120px-Tactical_Mk._3_%28Revival%29.png.webp",
  "Tactical Mk. 3 (Defensive)":"https://arcraiders.wiki/w/images/thumb/a/a9/Tactical_Mk._3_%28Defensive%29.png/120px-Tactical_Mk._3_%28Defensive%29.png.webp",
  "Tactical Mk. 3 (Healing)":"https://arcraiders.wiki/w/images/thumb/1/12/Tactical_Mk._3_%28Healing%29.png/120px-Tactical_Mk._3_%28Healing%29.png.webp",
  "Angled Grip II":"https://arcraiders.wiki/w/images/thumb/2/2b/Angled_Grip_II.png/120px-Angled_Grip_II.png.webp",
  "Angled Grip III":"https://arcraiders.wiki/w/images/thumb/0/0f/Angled_Grip_III.png/120px-Angled_Grip_III.png.webp",
  "Compensator I":"https://arcraiders.wiki/w/images/thumb/5/5f/Compensator_I.png/120px-Compensator_I.png.webp",
  "Compensator II":"https://arcraiders.wiki/w/images/thumb/0/0a/Compensator_II.png/120px-Compensator_II.png.webp",
  "Extended Barrel":"https://arcraiders.wiki/w/images/thumb/2/2f/Extended_Barrel.png/120px-Extended_Barrel.png.webp",
  "Barricade Kit":"https://arcraiders.wiki/w/images/thumb/c/cb/Barricade_Kit.png/120px-Barricade_Kit.png.webp",
  "Defibrillator":"https://arcraiders.wiki/w/images/thumb/5/5f/Defibrillator.png/120px-Defibrillator.png.webp",
  "Vita Shot":"https://arcraiders.wiki/w/images/thumb/7/7d/Vita_Shot.png/120px-Vita_Shot.png.webp",
  "Vita Spray":"https://arcraiders.wiki/w/images/thumb/1/1d/Vita_Spray.png/120px-Vita_Spray.png.webp",
  "Complex Gun Parts":"https://arcraiders.wiki/w/images/thumb/3/3d/Complex_Gun_Parts.png/120px-Complex_Gun_Parts.png.webp",
  "Heavy Gun Parts":"https://arcraiders.wiki/w/images/thumb/3/33/Heavy_Gun_Parts.png/120px-Heavy_Gun_Parts.png.webp",
  "Light Gun Parts":"https://arcraiders.wiki/w/images/thumb/c/c9/Light_Gun_Parts.png/120px-Light_Gun_Parts.png.webp",
  "Medium Gun Parts":"https://arcraiders.wiki/w/images/thumb/9/9a/Medium_Gun_Parts.png/120px-Medium_Gun_Parts.png.webp",
  "Muzzle Brake II":"https://arcraiders.wiki/w/images/thumb/2/23/Muzzle_Brake_II.png/120px-Muzzle_Brake_II.png.webp",
  "Muzzle Brake III":"https://arcraiders.wiki/w/images/thumb/a/a2/Muzzle_Brake_III.png/120px-Muzzle_Brake_III.png.webp",
  "Extended Light Mag II":"https://arcraiders.wiki/w/images/thumb/c/cf/Extended_Light_Mag_II.png/120px-Extended_Light_Mag_II.png.webp",
  "Extended Light Mag III":"https://arcraiders.wiki/w/images/thumb/4/40/Extended_Light_Mag_III.png/120px-Extended_Light_Mag_III.png.webp",
  "Extended Medium Mag II":"https://arcraiders.wiki/w/images/thumb/5/50/Extended_Medium_Mag_II.png/120px-Extended_Medium_Mag_II.png.webp",
  "Extended Medium Mag III":"https://arcraiders.wiki/w/images/thumb/a/a1/Extended_Medium_Mag_III.png/120px-Extended_Medium_Mag_III.png.webp",
  "Extended Shotgun Mag II":"https://arcraiders.wiki/w/images/thumb/4/4f/Extended_Shotgun_Mag_II.png/120px-Extended_Shotgun_Mag_II.png.webp",
  "Extended Shotgun Mag III":"https://arcraiders.wiki/w/images/thumb/7/77/Extended_Shotgun_Mag_III.png/120px-Extended_Shotgun_Mag_III.png.webp",
  "Shotgun Choke II":"https://arcraiders.wiki/w/images/thumb/6/63/Shotgun_Choke_II.png/120px-Shotgun_Choke_II.png.webp",
  "Shotgun Choke III":"https://arcraiders.wiki/w/images/thumb/3/36/Shotgun_Choke_III.png/120px-Shotgun_Choke_III.png.webp",
  "Shotgun Silencer":"https://arcraiders.wiki/w/images/thumb/4/4d/Shotgun_Silencer.png/120px-Shotgun_Silencer.png.webp",
  "Silencer I":"https://arcraiders.wiki/w/images/thumb/f/f7/Silencer_I.png/120px-Silencer_I.png.webp",
  "Silencer II":"https://arcraiders.wiki/w/images/thumb/c/c0/Silencer_II.png/120px-Silencer_II.png.webp",
  "Snap Hook":"https://arcraiders.wiki/w/images/thumb/5/56/Snap_Hook.png/100px-Snap_Hook.png.webp",
  "Stable Stock II":"https://arcraiders.wiki/w/images/thumb/b/b4/Stable_Stock_II.png/120px-Stable_Stock_II.png.webp",
  "Stable Stock III":"https://arcraiders.wiki/w/images/thumb/e/eb/Stable_Stock_III.png/120px-Stable_Stock_III.png.webp",
  "Vertical Grip II":"https://arcraiders.wiki/w/images/thumb/3/3c/Vertical_Grip_II.png/120px-Vertical_Grip_II.png.webp",
  "Vertical Grip III":"https://arcraiders.wiki/w/images/thumb/2/20/Vertical_Grip_III.png/120px-Vertical_Grip_III.png.webp",
  "Lightweight Stock":"https://arcraiders.wiki/w/images/thumb/c/cb/Lightweight_Stock.png/120px-Lightweight_Stock.png.webp",
  "Padded Stock":"https://arcraiders.wiki/w/images/thumb/4/4b/Padded_Stock.png/120px-Padded_Stock.png.webp",
  "Blue Light Stick":"https://arcraiders.wiki/w/images/thumb/c/cc/Blue_Light_Stick.png/120px-Blue_Light_Stick.png.webp",
  "Red Light Stick":"https://arcraiders.wiki/w/images/thumb/9/93/Red_Light_Stick.png/120px-Red_Light_Stick.png.webp",
  "Yellow Light Stick":"https://arcraiders.wiki/w/images/thumb/1/1f/Yellow_Light_Stick.png/120px-Yellow_Light_Stick.png.webp",
  "Green Light Stick":"https://arcraiders.wiki/w/images/thumb/2/27/Green_Light_Stick.png/120px-Green_Light_Stick.png.webp",
  "Fireworks Box":"https://arcraiders.wiki/w/images/thumb/0/0f/Fireworks_Box.png/120px-Fireworks_Box.png.webp",
  "Remote Raider Flare":"https://arcraiders.wiki/w/images/thumb/f/ff/Remote_Raider_Flare.png/120px-Remote_Raider_Flare.png.webp",
};

// Name aliases for BP_IMAGES lookup (BLUEPRINTS names may differ from wiki keys)
const BP_NAME_ALIASES = {
  "Trigger 'Nade": "Trigger Nade",
  "Trailblazer": "Trailblazer Grenade",
};

function getBpImage(name) {
  if (!name) return null;
  const alias = BP_NAME_ALIASES[name] || name;
  if (BP_IMAGES[alias]) return BP_IMAGES[alias];
  if (BP_IMAGES[name]) return BP_IMAGES[name];
  const lower = (alias || name).toLowerCase();
  for (const [k, v] of Object.entries(BP_IMAGES)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v;
  }
  return null;
}

// Placeholder SVG for blueprints without images (ARC-style blueprint silhouette, red accent)
const PLACEHOLDER_SVG = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="4" stroke="rgba(237,57,27,0.4)" stroke-width="2"/><path d="M20 24h24M20 32h16M20 40h20" stroke="rgba(237,57,27,0.3)" stroke-width="1.5" stroke-linecap="round"/></svg>'
);

function BPCard({ bp, isObtained, toggling, drop, onToggle, onAuthRequired, user, mfMeta = null }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, above: true });
  const cardRef = useRef(null);

  useEffect(() => {
    if (!showPopup || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const popupH = 120;
    const showAbove = rect.top > popupH + 24;
    const top = showAbove ? rect.top - popupH - 8 : rect.bottom + 8;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 120, window.innerWidth - 260));
    setPopupPos({ top, left, above: showAbove });
  }, [showPopup]);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (!user) { onAuthRequired?.(); return; }
    onToggle(bp);
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: "relative",
        overflow: "visible",
        ...GRID_BG,
        border: `1px solid ${isObtained ? "rgba(29,184,148,0.45)" : "rgba(100,160,255,0.12)"}`,
        borderRadius: 6,
        display: "flex",
        flexDirection: "column",
        opacity: toggling.has(bp.id) ? 0.5 : 1,
        transition: "border-color 0.15s, opacity 0.15s",
      }}
      onMouseEnter={() => setShowPopup(true)}
      onMouseLeave={() => setShowPopup(false)}
    >
      {/* Name + checkbox — same row, name left, checkbox right */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${isObtained ? "rgba(29,184,148,0.2)" : "rgba(100,160,255,0.1)"}`,
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isObtained ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)",
            lineHeight: 1.35,
            textDecoration: isObtained ? "line-through" : "none",
            transition: "color 0.15s",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={bp.name || bp.id}
        >
          {bp.name || bp.id}
        </div>
        <button
          type="button"
          className="bp-card-checkbox"
          onClick={handleCheckboxClick}
          title={isObtained ? "Mark as not owned" : "Mark as owned"}
          style={{
            width: 22,
            height: 22,
            minWidth: 22,
            minHeight: 22,
            borderRadius: 5,
            background: isObtained ? "var(--teal)" : "rgba(0,0,0,0.55)",
            border: `1.5px solid ${isObtained ? "var(--teal)" : "rgba(255,255,255,0.2)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.15s, border-color 0.15s",
            flexShrink: 0,
            alignSelf: "center",
            padding: 0,
            boxShadow: "none",
          }}
        >
          {isObtained && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <polyline points="2,6 5,9 10,3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Image area — arcraiders.wiki images with placeholder fallback */}
      <div
        style={{
          width: "100%",
          height: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={getBpImage(bp.name) || mfMeta?.icon || PLACEHOLDER_SVG}
          alt={bp.name || bp.id}
          style={{
            width: 72,
            height: 72,
            objectFit: "contain",
            opacity: isObtained ? 0.45 : 1,
            transition: "opacity 0.15s",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>

      {/* Hover popup — where to find + description */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: popupPos.top,
            left: popupPos.left,
            width: 280,
            background: "var(--bg3)",
            border: "1px solid var(--border2)",
            borderRadius: 8,
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            padding: 16,
            zIndex: 9999,
            overflow: "auto",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6, color: "var(--white)" }}>
            {bp.name || bp.id}
          </div>
          {/* MetaForge enrichment: rarity + description */}
          {mfMeta && (
            <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {mfMeta.rarity && (
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: RARITY_COLORS[mfMeta.rarity] ?? "var(--dim)",
                }}>
                  {mfMeta.rarity}
                </span>
              )}
              {mfMeta.description && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                  {mfMeta.description}
                </div>
              )}
              {mfMeta.workbench && (
                <div style={{ fontSize: 11, color: "var(--cobalt)" }}>
                  🔧 Crafted at: {mfMeta.workbench}
                </div>
              )}
            </div>
          )}
          {drop ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--cobalt)", textTransform: "uppercase", marginBottom: 8 }}>
                📍 Where to find
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.95)", lineHeight: 1.5, marginBottom: 6 }}>
                <strong>Map:</strong> {drop.map}
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 6 }}>
                <strong>Condition:</strong> {drop.condition}
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 6 }}>
                <strong>Containers:</strong> {drop.containers}
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, marginBottom: 6 }}>
                <strong>Scavengable:</strong> {drop.scavengable ? "Yes" : "No"}
              </div>
              {drop.trialsReward && (
                <div style={{ fontSize: 13, color: "var(--teal)", lineHeight: 1.45, marginBottom: 6 }}>
                  🏆 Trials: {drop.trialsReward}
                </div>
              )}
              {drop.questReward && (
                <div style={{ fontSize: 13, color: "var(--gold)", lineHeight: 1.45, marginTop: 6, padding: "8px 10px", background: "rgba(212,43,43,0.12)", borderRadius: 4 }}>
                  🎯 Quest: {drop.questReward}
                </div>
              )}
              {drop.location && (
                <div style={{ fontSize: 13, color: "var(--teal)", marginTop: 6 }}>
                  📌 {drop.location}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>Location TBD</div>
          )}
        </div>
      )}
    </div>
  );
}

const GRID_BG = {
  background: "#0d1525",
  backgroundImage: [
    "linear-gradient(rgba(100,160,255,0.06) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(100,160,255,0.06) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "24px 24px",
};

function StatBox({ label, value, accent }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, padding: "12px 16px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, color: accent || "var(--white)", lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

export default function BlueprintTracker({ user, onAuthRequired, onNavigate }) {
  const [blueprints,   setBlueprints]   = useState([]);
  const [obtained,     setObtained]     = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [toggling,     setToggling]     = useState(new Set());
  const [hideObtained, setHideObtained] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  // Stable array of blueprint IDs — memoised so useMfBlueprints doesn't re-run on every render
  const blueprintIds = useMemo(() => BLUEPRINTS.map((bp) => bp.id), []);

  // MetaForge enrichment: icons, descriptions, rarity. Fails gracefully when API is down.
  const { blueprintMeta } = useMfBlueprints(blueprintIds);

  useEffect(() => {
    setBlueprints(BLUEPRINTS);
    const load = async () => {
      if (user) {
        try {
          const uDoc = await getDoc(doc(db, "users", user.uid));
          if (uDoc.exists()) setObtained(new Set(uDoc.data().obtainedBlueprints || []));
        } catch { /* ok */ }
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user?.uid]);

  const toggle = async (bp) => {
    if (!user) { onAuthRequired?.(); return; }
    if (toggling.has(bp.id)) return;
    const wasObtained = obtained.has(bp.id);
    setToggling(prev => new Set([...prev, bp.id]));
    setObtained(prev => {
      const next = new Set(prev);
      wasObtained ? next.delete(bp.id) : next.add(bp.id);
      return next;
    });
    try {
      await setDoc(doc(db, "users", user.uid), {
        obtainedBlueprints: wasObtained ? arrayRemove(bp.id) : arrayUnion(bp.id)
      }, { merge: true });
    } catch {
      setObtained(prev => {
        const next = new Set(prev);
        wasObtained ? next.add(bp.id) : next.delete(bp.id);
        return next;
      });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(bp.id); return n; });
    }
  };

  const unselectAll = async () => {
    if (!user) { onAuthRequired?.(); return; }
    if (obtained.size === 0) return;
    setObtained(new Set());
    try {
      await setDoc(doc(db, "users", user.uid), { obtainedBlueprints: [] }, { merge: true });
    } catch { /* ok */ }
  };

  const missingBlueprints = blueprints.filter((b) => !obtained.has(b.id));
  const displayed = hideObtained ? missingBlueprints : blueprints;

  const handleDownloadPdf = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      if (!reportRef.current) throw new Error("Report not ready");
      await downloadReportAsPdf(reportRef.current, "missing-blueprints-report.pdf");
    } catch (err) {
      console.error("PDF download failed:", err);
      setDownloadError(err?.message || "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      if (!reportRef.current) throw new Error("Report not ready");
      await downloadReportAsImage(reportRef.current, "missing-blueprints-report.jpg");
    } catch (err) {
      console.error("Image download failed:", err);
      setDownloadError(err?.message || "Failed to generate image");
    } finally {
      setDownloading(false);
    }
  };

  const obtainedCount = blueprints.filter(b => obtained.has(b.id)).length;
  const total = blueprints.length;
  const needed = total - obtainedCount;
  const pct = total ? Math.round((obtainedCount / total) * 100) : 0;

  return (
    <div className="blueprint-tracker-page" style={{ minHeight: "100dvh", position: "relative" }}>
      {/* Hidden report for PDF/JPEG capture */}
      <div
        ref={reportRef}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          zIndex: -1,
          visibility: "hidden",
        }}
      >
        <MissingBlueprintsReport
          missingBlueprints={missingBlueprints}
          userName={user?.displayName}
          totalCount={blueprints.length}
        />
      </div>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "var(--bg)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 2 }}>
      {/* Header — blueprint background at full color, no overlay/tint */}
      <div
        style={{
          position: "relative",
          padding: "28px 20px 24px",
          marginBottom: 24,
          backgroundImage: `url(${blueprintBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {["var(--red)", "var(--cobalt)", "var(--teal)", "var(--red)"].map((c, i) => (
              <div key={i} style={{ width: 28, height: 3, background: c, borderRadius: 2 }} />
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.25em", color: "var(--red)", textTransform: "uppercase", marginBottom: 6, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>
            Speranza Intel
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, color: "var(--white)", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9)" }}>
            Blueprint
          </h1>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14, color: "var(--red)", textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9)" }}>
            Tracker
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.95)", lineHeight: 1.55, marginBottom: 20, maxWidth: 520, textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}>
            Track every ARC blueprint you&apos;ve secured and see where missing pieces drop.
          </p>

          {/* Progress badge */}
          {!loading && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(237,57,27,0.4)",
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", color: "var(--dim)", textTransform: "uppercase" }}>
                Needed: {needed} / {total}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: pct === 100 ? "var(--teal)" : "var(--red)", lineHeight: 1 }}>
                {obtainedCount} collected
              </span>
            </div>
          )}

          {/* Note */}
          <div style={{ fontSize: 15, color: "var(--dim)", marginBottom: 20, lineHeight: 1.6, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
            {user
              ? "Click the checkbox to mark as obtained or uncheck to remove. Hover over a blueprint for drop location."
              : "Sign in to save your personal blueprint progress."}
            {" "}Spawn data from{" "}
            <a href="https://arcraiders.wiki/wiki/Blueprints" target="_blank" rel="noopener noreferrer" style={{ color: "var(--cobalt)", textDecoration: "underline" }}>
              ARC Raiders Wiki
            </a>.
          </div>

          {/* Stats */}
          {!loading && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <StatBox label="Total BP" value={total} />
                <StatBox label="Obtained" value={obtainedCount} accent="var(--teal)" />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <StatBox label="Missing" value={needed} accent="var(--red)" />
                <StatBox label="Duplicates" value={0} />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch", marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{
                  flex: 1, minWidth: 140, padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Status</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: pct === 100 ? "var(--teal)" : "var(--white)", lineHeight: 1 }}>{pct}%</span>
                  <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden", marginLeft: 4 }}>
                    <div style={{
                      height: "100%", width: `${pct}%`,
                      background: pct === 100 ? "var(--teal)" : "linear-gradient(90deg, var(--red), var(--cobalt))",
                      borderRadius: 3, transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
                <button
                  onClick={() => setHideObtained(h => !h)}
                  style={{
                    padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                    background: hideObtained ? "rgba(29,184,148,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${hideObtained ? "rgba(29,184,148,0.4)" : "rgba(255,255,255,0.08)"}`,
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: hideObtained ? "var(--teal)" : "rgba(255,255,255,0.55)",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    {hideObtained
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                  {hideObtained ? "Show All" : "Show only missing blueprints"}
                </button>
              </div>
              <div className="bp-download-actions">
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    cursor: downloading ? "not-allowed" : "pointer",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(237,57,27,0.4)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloading ? "Generating…" : "Download as PDF"}
                </button>
                <button
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    cursor: downloading ? "not-allowed" : "pointer",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(237,57,27,0.4)",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  {downloading ? "Generating…" : "Download as Image"}
                </button>
              </div>
              {downloadError && (
                <div style={{ fontSize: 14, color: "var(--red)", marginBottom: 8 }}>
                  {downloadError}
                </div>
              )}
              <div style={{ marginBottom: 0 }}>
                <button
                  onClick={unselectAll}
                  style={{
                    padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                  Unselect All
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Blueprint grid */}
      {(loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, padding: "0 16px 32px", maxWidth: 1200, margin: "0 auto" }}>
          {displayed.map(bp => {
            const drop = getDropForBlueprint(bp.name);
            return (
              <BPCard
                key={bp.id}
                bp={bp}
                isObtained={obtained.has(bp.id)}
                toggling={toggling}
                drop={drop}
                onToggle={toggle}
                onAuthRequired={onAuthRequired}
                user={user}
                mfMeta={blueprintMeta.get(bp.id) ?? null}
              />
            );
          })}
          {displayed.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--dim)", padding: "48px 0", fontSize: 16, lineHeight: 1.5 }}>
              {hideObtained && obtainedCount === total
                ? "You've collected every blueprint currently in the database."
                : "No blueprints found."}
            </div>
          )}
        </div>
      ))}
      {/* Required attribution for MetaForge data usage */}
      {blueprintMeta.size > 0 && (
        <div style={{ padding: "16px 20px 24px", textAlign: "center" }}>
          <MetaForgeAttribution variant="compact" />
        </div>
      )}
      </div>
    </div>
  );
}
