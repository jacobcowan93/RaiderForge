import { useState, useMemo, useEffect, useRef } from "react";
import { ITEMS, ITEM_CATEGORIES, RARITY_COLOR } from "../shared/data/items_data";
import { BLUEPRINT_DROPS } from "../shared/data/blueprint_drops";
import { WIKI_ITEM_ICONS } from "../shared/data/item_icons";
import arcItemsBg from "../assets/ARC_Items.png";

const ARDB_STATIC = "https://ardb.app/static";

const CATEGORY_COLORS = {
  Weapon:       "var(--red)",
  Blueprint:    "var(--purple)",
  Modification: "var(--cobalt)",
  Attachment:   "var(--cobalt)",
  Equipment:    "var(--teal)",
  Material:     "var(--gold)",
  Augment:      "var(--purple)",
  Consumable:   "var(--teal)",
  Ammunition:  "var(--gold)",
  Ammo:         "var(--gold)",
  Key:          "var(--red)",
  Junk:         "rgba(255,255,255,0.3)",
  Nature:       "var(--teal)",
  Plant:        "var(--teal)",
  Shield:       "var(--cobalt)",
  "Quick Use":  "var(--teal)",
  Recyclable:   "rgba(255,255,255,0.3)",
  Trinket:      "var(--gold)",
  Misc:         "var(--dim)",
};

// Get base name for tiered items (e.g. "Hullcracker I" -> "Hullcracker")
function getBaseName(name) {
  return name.replace(/\s+(I|II|III|IV)$/, "").trim();
}

function ItemCard({ item, icon, bpLocation, desc, accent }) {
  const rarityColor = RARITY_COLOR?.[item.rarity] || "var(--dim)";
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ showAbove: true, left: 0 });
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => { setImgError(false); }, [icon]);

  useEffect(() => {
    if (!showPopup || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const popupW = 280;
    const popupH = 280;
    const gap = 8;
    const showAbove = rect.top > popupH + gap + 24;
    // Center horizontally, clamp to viewport
    const idealLeft = rect.left + rect.width / 2 - popupW / 2;
    const left = Math.max(12, Math.min(idealLeft, window.innerWidth - popupW - 12));
    setPopupPos({ showAbove, left: left - rect.left });
  }, [showPopup]);

  const [pinned, setPinned] = useState(false);
  const handleMouseEnter = () => setShowPopup(true);
  const handleMouseLeave = () => { if (!pinned) setShowPopup(false); };
  const handleClick = (e) => { e.stopPropagation(); setPinned(prev => !prev); setShowPopup(prev => !prev); };

  return (
    <div
      ref={cardRef}
      className="item-library-card-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className={`item-library-card ${showPopup ? "item-library-card-hover" : ""}`}
        style={{
          "--item-accent": accent,
          "--item-rarity": rarityColor,
        }}
      >
        <div className="item-library-card-rarity" aria-hidden />
        <div className="item-library-card-image-wrap">
          {icon && !imgError ? (
            <img
              src={icon}
              alt={item.name}
              className="item-library-card-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="item-library-card-placeholder">?</div>
          )}
        </div>
        <div className="item-library-card-name">{item.name}</div>
      </div>
      {showPopup && (
        <div
          className={`item-library-popup ${popupPos.showAbove ? "item-library-popup-above" : "item-library-popup-below"}`}
          style={{
            left: popupPos.left,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {icon && !imgError && (
              <img
                src={icon}
                alt=""
                style={{ width: 52, height: 52, objectFit: "contain", background: "rgba(0,0,0,0.3)", borderRadius: 6, flexShrink: 0 }}
                onError={() => setImgError(true)}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--white)", marginBottom: 2, lineHeight: 1.2 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {item.category}
              </div>
            </div>
          </div>
          {bpLocation && bpLocation.length > 0 && (
            <div style={{
              fontSize: 12, color: "var(--teal)", fontWeight: 600, letterSpacing: "0.05em",
              marginBottom: 8, padding: "6px 8px", background: "rgba(29,184,148,0.12)", borderRadius: 6,
            }}>
              <div style={{ marginBottom: 4 }}>📍 Blueprint location{bpLocation.length > 1 ? "s" : ""}:</div>
              {bpLocation.map((loc, idx) => (
                <div key={idx} style={{ color: "rgba(255,255,255,0.9)", fontWeight: 500, marginTop: idx ? 4 : 2 }}>
                  {loc.variant ? `${loc.variant}: ` : ""}{loc.map} • {loc.condition}
                </div>
              ))}
            </div>
          )}
          {desc && (
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, fontFamily: "sans-serif",
            }}>
              {desc}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Get blueprint base name ("Angled Grip II Blueprint" -> "Angled Grip II")
function getBlueprintBaseName(name) {
  return name.replace(/\s+Blueprint$/, "").trim();
}

export default function ItemLibrary() {
  const [search, setSearch] = useState("");
  const [cat,    setCat]    = useState("All");
  const [ardbData, setArdbData] = useState({}); // name -> { icon, description, id }

  useEffect(() => {
    fetch("https://ardb.app/api/items")
      .then(r => r.json())
      .then(items => {
        const byName = {};
        const byId = {};
        items.forEach(x => {
          const icon = x.icon ? ARDB_STATIC + x.icon : (x.id ? ARDB_STATIC + "/items/icons/" + x.id + ".webp" : null);
          const entry = { icon, description: x.description || null, id: x.id };
          byName[x.name] = entry;
          if (x.id) byId[x.id] = entry;
        });
        setArdbData({ byName, byId });
      })
      .catch(() => setArdbData({ byName: {}, byId: {} }));
  }, []);

  // Resolve icon for an item (ardb first, then wiki fallback)
  const getItemIcon = (item) => {
    const lookup = ardbData.byName || {};
    const byId = ardbData.byId || {};
    // Try exact name from ardb
    let entry = lookup[item.name];
    if (entry?.icon) return entry.icon;
    // Try base name (for "Hullcracker I" -> "Hullcracker")
    const base = getBaseName(item.name);
    if (base !== item.name) {
      entry = lookup[base];
      if (entry?.icon) return entry.icon;
    }
    // For blueprints, try base item name
    if (item.category === "Blueprint") {
      const bpBase = getBlueprintBaseName(item.name);
      entry = lookup[bpBase] || lookup[bpBase + " Blueprint"];
      if (entry?.icon) return entry.icon;
    }
    // Try ardb id fallback (e.g. "Hullcracker I" -> "hullcracker_t1", "Anvil II" -> "anvil_t2")
    const tierMatch = item.name.match(/^(.+?)\s+(I|II|III|IV)$/);
    if (tierMatch) {
      const [, base, tier] = tierMatch;
      const tierNum = { I: "1", II: "2", III: "3", IV: "4" }[tier];
      const baseId = base.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      const id1 = baseId + (tierNum === "1" ? "" : "_t" + tierNum);
      const id2 = baseId + "_t" + tierNum;
      if (byId[id1]?.icon) return byId[id1].icon;
      if (byId[id2]?.icon) return byId[id2].icon;
    }
    // Slug-based ardb fallback (e.g. "Heavy Ammo" -> "heavy_ammo", "Trigger 'Nade" -> "trigger_nade")
    const slug = item.name.toLowerCase().replace(/\s+/g, "_").replace(/['']/g, "").replace(/[^a-z0-9_]/g, "");
    if (byId[slug]?.icon) return byId[slug].icon;
    if (item.category === "Blueprint") {
      const bpSlug = getBlueprintBaseName(item.name).toLowerCase().replace(/\s+/g, "_").replace(/['']/g, "").replace(/[^a-z0-9_]/g, "");
      if (byId[bpSlug]?.icon) return byId[bpSlug].icon;
      if (byId[bpSlug + "_blueprint"]?.icon) return byId[bpSlug + "_blueprint"].icon;
    }
    // Wiki fallback (works even before ardb loads)
    const wikiIcon = WIKI_ITEM_ICONS[item.name] || WIKI_ITEM_ICONS[base] || (item.category === "Blueprint" ? WIKI_ITEM_ICONS[getBlueprintBaseName(item.name)] : null);
    // Generic blueprint/recipe icon as last resort for blueprints
    if (!wikiIcon && item.category === "Blueprint") return WIKI_ITEM_ICONS["recipe"];
    return wikiIcon;
  };

  // Get blueprint location from arcblueprinttracker data (for any craftable item)
  const getBlueprintLocation = (item) => {
    const baseName = item.category === "Blueprint" ? getBlueprintBaseName(item.name) : item.name;
    // Direct match
    let loc = BLUEPRINT_DROPS[baseName] || BLUEPRINT_DROPS[item.name] || BLUEPRINT_DROPS[baseName + " Grenade"] || BLUEPRINT_DROPS[baseName.replace("Nade", "'Nade")];
    if (loc) return [loc];
    // For consolidated items (e.g. "Angled Grip"), try tier variants
    const variants = [" II", " III", " I", " IV"];
    const locations = [];
    for (const v of variants) {
      const match = BLUEPRINT_DROPS[baseName + v];
      if (match && !locations.some(l => l.map === match.map && l.condition === match.condition)) {
        locations.push({ ...match, variant: v.trim() });
      }
    }
    return locations.length ? locations : null;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ITEMS.filter(item => {
      const matchCat = cat === "All" || item.category === cat;
      const matchQ   = !q || item.name.toLowerCase().includes(q) || item.desc?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [search, cat]);

  const ITEMS_PER_PAGE = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState(1);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, cat]);

  const counts = useMemo(() => {
    const m = { All: ITEMS.length };
    ITEM_CATEGORIES.forEach(c => { m[c] = ITEMS.filter(i => i.category === c).length; });
    return m;
  }, []);

  return (
    <div className="item-library-page">
      {/* Background image — Item Library only */}
      <div
        className="item-library-bg"
        style={{ backgroundImage: `url(${arcItemsBg})` }}
        aria-hidden
      />
      {/* Readability overlay */}
      <div className="item-library-overlay" aria-hidden />
      <div className="item-library-content">
      {/* Header */}
      <div style={{ padding:"24px 16px 16px" }}>
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          {["var(--red)","var(--purple)","var(--teal)","var(--gold)"].map((c,i) => (
            <div key={i} style={{ width:28, height:3, background:c, borderRadius:2 }} />
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:8, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.25em", color:"var(--red)", textTransform:"uppercase", marginBottom:4 }}>Compendium</div>
            <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>Item Library</h1>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, letterSpacing:"0.12em", color:"var(--dim)", textTransform:"uppercase" }}>Showing</div>
            <div style={{ fontSize:30, fontWeight:700, color:"var(--gold)", lineHeight:1 }}>
              {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          className="input item-library-search-input"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom:12 }}
        />

        {/* Category filter */}
        <div className="filter-bar item-library-filter-bar">
          <button className={`pill${cat==="All"?" active":""}`} onClick={() => setCat("All")}>
            All ({counts.All})
          </button>
          {ITEM_CATEGORIES.map(c => (
            <button key={c} className={`pill${cat===c?" active":""}`} onClick={() => setCat(c)}>
              {c} ({counts[c]})
            </button>
          ))}
        </div>
      </div>

      {/* Pagination controls (top) */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="item-library-pagination">
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding:"8px 16px", opacity: page <= 1 ? 0.5 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize:14, color:"var(--dim)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding:"8px 16px", opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Item grid - 10 rows × 5 columns (50 per page), images from ardb.app */}
      <div className="item-library-grid">
        {filtered.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", color:"var(--dim)", padding:"48px 0", fontSize:16 }}>
            No items match your search.
          </div>
        )}
        {paginatedItems.map((item, i) => (
          <ItemCard
            key={`${item.name}-${i}`}
            item={item}
            icon={getItemIcon(item)}
            bpLocation={getBlueprintLocation(item)}
            desc={ardbData.byName?.[item.name]?.description || item.desc}
            accent={CATEGORY_COLORS[item.category] || "var(--dim)"}
          />
        ))}
      </div>

      {/* Pagination controls (bottom) */}
      {filtered.length > ITEMS_PER_PAGE && (
        <div className="item-library-pagination item-library-pagination-bottom">
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding:"8px 16px", opacity: page <= 1 ? 0.5 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize:14, color:"var(--dim)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding:"8px 16px", opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Attribution */}
      <div style={{ padding:"0 16px 24px", fontSize:11, color:"var(--dim)", textAlign:"center" }}>
        Item images from{" "}
        <a href="https://ardb.app/db/items" target="_blank" rel="noopener noreferrer" style={{ color:"var(--cobalt)", textDecoration:"underline" }}>
          ardb.app
        </a>
        {" · "}
        Blueprint locations from{" "}
        <a href="https://arcblueprinttracker.io/data" target="_blank" rel="noopener noreferrer" style={{ color:"var(--cobalt)", textDecoration:"underline" }}>
          arcblueprinttracker.io
        </a>
      </div>
      </div>
    </div>
  );
}
