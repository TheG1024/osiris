# Osiris Design System - MASTER

## Product Analysis

**Product:** Satellite Intelligence / OSINT Dashboard
**Industry:** Tech & SaaS → Cybersecurity Platform
**Category Code:** Rule #4 - Cybersecurity Platform

---

## Design System Output

### Pattern
**Layout:** Real-Time Monitoring + Data-Dense Dashboard
- Left sidebar: Search, filters, stats
- Center: Interactive map with entity markers
- Right sidebar: Intel panel / entity details
- Top header: Status bar with entity count, TLE status, timestamp

### Style
**Primary:** HUD/Sci-Fi FUI (Heads-Up Display)
- Dark terminal aesthetic with neon accents
- Scan-line effects, corner brackets, grid overlays
- Technical/mission-control feel

**Secondary:** Dark Mode (OLED) - for maximum contrast

### Colors

| Role | Color | Hex |
|------|-------|-----|
| Background Primary | Near Black | `#0a0a0a` |
| Background Secondary | Dark Green-Black | `#0d1a0d` |
| Accent Primary | Phosphor Green | `#00ff41` |
| Accent Secondary | Cyan (Aircraft) | `#00d4ff` |
| Accent Tertiary | Orange (Ships) | `#ff6b00` |
| Accent Quaternary | Magenta (Satellites) | `#ff00ff` |
| Alert/Event | Red (Fires) | `#ff3333` |
| Warning | Yellow (Earthquakes) | `#ffff00` |
| Text Primary | Phosphor Green | `#00ff41` |
| Text Secondary | Dim Green | `#00ff4180` |
| Text Muted | Dark Gray | `#404040` |
| Border | Dark Green | `#1a3a1a` |

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Heading/Logo | Orbitron | 700 (Bold) |
| Body/UI | JetBrains Mono | 400 (Regular) |
| Data/Numbers | JetBrains Mono | 500 (Medium) |
| Labels | JetBrains Mono | 400 (Regular) |

**Font Sources:**
- Orbitron: Google Fonts (https://fonts.google.com/specimen/Orbitron)
- JetBrains Mono: Google Fonts (https://fonts.google.com/specimen/JetBrains+Mono)

### Effects

**Shadows & Glows:**
- Phosphor glow: `0 0 10px #00ff41, 0 0 20px #00ff41`
- Panel inner glow: `inset 0 0 30px rgba(0,255,65,0.05)`
- Entity marker glow: `box-shadow: 0 0 15px <entity-color>`

**Animations:**
- Scan lines: CSS repeating-linear-gradient, subtle
- Blink effect: 1s infinite (for LIVE status)
- Hover transitions: 150-300ms ease
- Entity marker pulse on hover: scale(1.5)

**Visual Elements:**
- Corner brackets on panels
- Grid overlay on map background
- Subtle scan-line effect on header

### Anti-Patterns (AVOID)

- ❌ **AI purple/pink gradients** - Not an AI product
- ❌ **Playful animations** - Serious intelligence platform
- ❌ **Emoji icons** - Use SVG (Heroicons/Lucide)
- ❌ **Bright neon beyond green** - Only green for core UI
- ❌ **Glassmorphism** - Wrong aesthetic for this product
- ❌ **Rounded corners > 4px** - Keep sharp/utilitarian

---

## Component Specifications

### Header
- Height: 64px
- Background: `#0a0a0a`
- Border bottom: 1px solid `#1a3a1a`
- Content: Logo (Orbitron), status indicators, timestamp

### Sidebar Panel
- Width: 256px (w-64)
- Background: Linear gradient (dark green-black)
- Border: 1px solid `#1a3a1a`
- Corner brackets decoration

### Entity Markers
- Shape: Diamond (rotated square) or Circle
- Size: 12px default, 18px on hover
- Colors per type:
  - Aircraft: `#00d4ff` (Cyan)
  - Ship: `#ff6b00` (Orange)
  - Satellite: `#ff00ff` (Magenta)
  - Fire: `#ff3333` (Red)
  - Earthquake: `#ffff00` (Yellow)

### Intel Panel
- Shows selected entity details
- Sanctions database status (19,778 entries)
- OFAC/Wikidata match results
- Loading states with spinner

### Buttons
- Border: 1px solid `#00ff41`
- Background: transparent (default), `#00ff41` (active)
- Text: `#00ff41` (default), black (active)
- Hover: background `#00ff41`, text black
- Transition: 150-300ms

### Text Inputs
- Background: black
- Border: 1px solid `#1a3a1a`
- Focus border: `#00ff41`
- Placeholder: `#00ff4140`

---

## Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile | 375px | Sidebar collapses to drawer |
| Tablet | 768px | Sidebar width reduces |
| Desktop | 1024px | Full layout |
| Ultra | 1440px | Maximum panel widths |

---

## Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG)
- [ ] cursor-pointer on clickable elements
- [ ] Hover states (150-300ms)
- [ ] Light mode: N/A (dark only)
- [ ] Focus states for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive at 375/768/1024/1440
- [ ] No AI purple gradients
- [ ] Industry-appropriate: military/intelligence aesthetic
- [ ] Typography: Orbitron + JetBrains Mono

---

## Generated

**Date:** 2026-06-07
**Skill:** UI/UX Pro Max (v2.0.0)
**Reasoning Rule:** Cybersecurity Platform → HUD/Sci-Fi FUI