# Design System: SPX Express Premium WMS

## 1. Visual Theme & Atmosphere
A high-precision, corporate-premium interface with a "Command Center" aesthetic. The layout is balanced yet dense, prioritizing data clarity and tactile interaction. The atmosphere is professional, clinical, and authoritative—leveraging deep navy tones and refined typography to convey trust and operational excellence.

## 2. Color Palette & Roles
- **Canvas White** (#F8FAFC) — Primary background surface.
- **Pure Surface** (#FFFFFF) — Card and container fill.
- **Deep Navy** (#0F172A) — Primary text, sidebar backgrounds, and authoritative headers.
- **Muted Slate** (#64748B) — Secondary text, descriptions, and metadata.
- **Corporate Cobalt** (#2563EB) — Single accent for CTAs, active states, and focus indicators.
- **Emerald Success** (#10B981) — Success states and positive metrics.
- **Ruby Error** (#EF4444) — Error states and critical alerts.
- **Whisper Border** (rgba(226,232,240,0.8)) — Structural lines and subtle dividers.

## 3. Typography Rules
- **Display & Stats:** `Geist` — Track-tight, semi-bold to bold for headlines and metrics.
- **Body:** `Outfit` — Clean, high-legibility sans-serif for general interface text.
- **Data/Mono:** `Geist Mono` — For order IDs, SKUs, timestamps, and high-density numbers to ensure alignment.
- **Banned:** Inter (too generic), Comic Sans, any handwritten fonts, or generic system serifs.

## 4. Component Stylings
* **Buttons:** Flat, semi-rounded (0.75rem). Tactile push effect (-2px Y-offset) on active. Cobalt fill for primary actions, subtle slate outline for secondary.
* **Cards:** Refined border-radius (1rem). Very subtle diffused shadow (0 4px 6px -1px rgb(0 0 0 / 0.05)). Use negative space for hierarchy in high-density areas.
* **Inputs:** Labels above, placeholder in light slate. 1px solid slate border that transitions to Cobalt on focus.
* **Status Badges:** Small, pill-shaped with light backgrounds and high-contrast text (e.g., Light Emerald bg with Deep Emerald text).
* **Charts:** Clean, monochrome base with Cobalt and Slate accents. No excessive colors.

## 5. Layout Principles
- **Grid-First**: Use 12-column grids for dashboards.
- **Asymmetric Login**: Left-side branding/illustration with right-side focused login form.
- **Data Density**: High-density tables with consistent row heights and clear column headers.
- **Responsive**: Strict single-column collapse on mobile. Sidebars become bottom sheets or hamburger menus.

## 6. Motion & Interaction
- **Spring Physics**: `stiffness: 120, damping: 20` for all transitions.
- **Cascade Reveals**: Staggered animation for dashboard stats and table rows.
- **Micro-Interactions**: Subtle hover scaling on stats cards and action buttons.

## 7. Anti-Patterns (Banned)
- No emojis (use professional icons like Lucide/Phosphor).
- No pure black (#000000).
- No neon glows or purple-centric "AI" aesthetics.
- No 3-column equal card grids—favor asymmetric or functional groupings.
- No generic "Lorem Ipsum"—use industry-relevant labels (SKU, Tracking ID).
