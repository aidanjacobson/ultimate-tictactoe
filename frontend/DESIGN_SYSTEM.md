# Ultimate TicTacToe - Design System

## Overview
This design system establishes a unified visual language for the Ultimate TicTacToe application. All UI components, pages, and interactions should adhere to these standards to maintain consistency and create a cohesive user experience.

---

## Color Palette

### Primary Colors (Dark Mode)
- **Background Base**: `#0f172a` (Deep Navy - darkest)
- **Background Secondary**: `#1e293b` (Dark Slate)
- **Background Tertiary**: `#334155` (Medium Slate)
- **Surface**: `#1a1f2e` (Almost Black)

### Accent Colors
- **Primary Accent**: `#3b82f6` (Bright Blue) - Main CTAs, active states, primary elements
- **Secondary Accent**: `#10b981` (Emerald Green) - Success, wins, positive actions
- **Tertiary Accent**: `#f59e0b` (Amber) - Warnings, pending states
- **Danger**: `#ef4444` (Red) - Errors, losses, destructive actions
- **Info**: `#06b6d4` (Cyan) - Information, highlights

### Text Colors
- **Text Primary**: `#f1f5f9` (Near White) - Main content
- **Text Secondary**: `#cbd5e1` (Light Gray) - Secondary content, labels
- **Text Tertiary**: `#94a3b8` (Medium Gray) - Disabled, hints
- **Text Inverse**: `#0f172a` (Dark Navy) - Text on light/accent backgrounds

### Game Board Colors
- **Player X**: `#3b82f6` (Blue)
- **Player O**: `#f59e0b` (Amber)
- **Neutral/Empty**: `#334155` (Medium Slate)
- **Winner Highlight**: `#10b981` (Emerald Green)
- **Active Corner Border**: `#06b6d4` (Cyan)

### Semantic Colors
- **Success**: `#10b981` (Emerald Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#06b6d4` (Cyan)

---

## Typography

### Font Family
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Monospace**: `'Monaco', 'Courier New', monospace` (for game IDs, code)

### Font Sizes & Weights
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 32px | 700 | Page titles |
| H2 | 24px | 600 | Section headers |
| H3 | 20px | 600 | Subsection headers |
| Body Large | 18px | 400 | Primary content |
| Body Normal | 16px | 400 | Main body text |
| Body Small | 14px | 400 | Secondary content |
| Label | 12px | 500 | Labels, tags |
| Caption | 11px | 400 | Helper text, timestamps |

### Line Heights
- Headings: 1.2
- Body: 1.6
- Compact: 1.4

---

## Spacing System

### Base Unit: 4px
All spacing derives from a 4px base unit.

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing, icon padding |
| sm | 8px | Small gaps, inline spacing |
| md | 12px | Standard padding, component spacing |
| lg | 16px | Section padding, main gaps |
| xl | 24px | Large gaps, section separation |
| 2xl | 32px | Page-level spacing |
| 3xl | 48px | Major sections |

---

## Component Architecture

### Button Variants

#### Primary Button
- Background: `#3b82f6` (Blue)
- Hover: `#2563eb` (Darker Blue)
- Active: `#1d4ed8` (Even darker)
- Text: `#f1f5f9` (White)
- Border Radius: 8px
- Padding: 10px 20px (md + sm)
- Font Weight: 600

#### Secondary Button
- Background: `#334155` (Slate)
- Hover: `#475569` (Lighter Slate)
- Active: `#64748b` (Even lighter)
- Text: `#f1f5f9` (White)
- Border Radius: 8px
- Padding: 10px 20px
- Font Weight: 600

#### Ghost Button
- Background: transparent
- Border: 1px solid `#475569`
- Hover: Background `#334155`
- Text: `#f1f5f9`
- Border Radius: 8px
- Padding: 10px 20px
- Font Weight: 600

#### Danger Button
- Background: `#ef4444` (Red)
- Hover: `#dc2626` (Darker Red)
- Active: `#b91c1c` (Even darker)
- Text: `#f1f5f9` (White)
- Border Radius: 8px
- Padding: 10px 20px
- Font Weight: 600

### Card Component
- Background: `#1e293b` (Dark Slate)
- Border: 1px solid `#334155` (Optional)
- Border Radius: 12px
- Padding: 20px (lg)
- Box Shadow: 0 4px 6px rgba(0, 0, 0, 0.3)
- Hover Shadow (interactive): 0 8px 12px rgba(0, 0, 0, 0.4)

### Input Fields
- Background: `#0f172a` (Deep Navy)
- Border: 1px solid `#334155`
- Border Radius: 8px
- Padding: 12px (md + sm)
- Text: `#f1f5f9`
- Placeholder: `#94a3b8` (Medium Gray)
- Focus Border: `#3b82f6` (Blue)
- Focus Shadow: 0 0 0 3px rgba(59, 130, 246, 0.1)

### Modal/Dialog
- Backdrop: rgba(0, 0, 0, 0.7)
- Background: `#1e293b`
- Border: 1px solid `#334155`
- Border Radius: 16px
- Padding: 24px (xl)

### Navigation Bar
- Background: `#0f172a` (Deep Navy)
- Border Bottom: 1px solid `#334155`
- Height: 60px
- Logo/Text: `#f1f5f9`
- Active Link: `#3b82f6`
- Inactive Link: `#cbd5e1`
- Hover Link: `#e2e8f0`

### Badge/Tag
- Background: `#334155` or `#3b82f6`
- Text: `#f1f5f9`
- Border Radius: 6px
- Padding: 4px 8px (xs, sm)
- Font Size: 12px

---

## State Indicators

### Loading State
- Spinner color: `#3b82f6` (Primary Blue)
- Background dim: rgba(15, 23, 42, 0.8)

### Disabled State
- Opacity: 0.5
- Cursor: not-allowed
- Background: `#334155`
- Text: `#94a3b8`

### Hover State
- Shadow enhancement: +4px depth
- Color shift: +1 shade lighter on accent colors
- Cursor: pointer (on interactive elements)

### Focus State (Keyboard Navigation)
- Outline: 2px solid `#3b82f6`
- Outline Offset: 2px

### Error State
- Border: 1px solid `#ef4444`
- Text: `#fca5a5`
- Background: rgba(239, 68, 68, 0.1)

### Success State
- Border: 1px solid `#10b981`
- Text: `#6ee7b7`
- Background: rgba(16, 185, 129, 0.1)

---

## Border & Shadows

### Border Radius
- Tight: 4px (small elements)
- Standard: 8px (buttons, inputs)
- Medium: 12px (cards)
- Large: 16px (modals, dropdowns)

### Shadows
- `sm`: 0 1px 2px rgba(0, 0, 0, 0.05)
- `md`: 0 4px 6px rgba(0, 0, 0, 0.1)
- `lg`: 0 10px 15px rgba(0, 0, 0, 0.2)
- `xl`: 0 20px 25px rgba(0, 0, 0, 0.3)

---

## Animations & Transitions

### Timing
- Fast: 150ms (hover states, simple transitions)
- Standard: 300ms (modal opens, state changes)
- Slow: 500ms (page transitions, complex animations)

### Easing Functions
- Ease-in: `cubic-bezier(0.4, 0, 1, 1)`
- Ease-out: `cubic-bezier(0, 0, 0.2, 1)`
- Ease-in-out: `cubic-bezier(0.4, 0, 0.2, 1)`

### Common Transitions
- Button hover: `all 150ms ease-out`
- Color change: `color 150ms ease-out`
- Transform: `transform 200ms ease-out`
- Opacity: `opacity 150ms ease-out`

---

## Accessibility

### Contrast Requirements
- Text Primary on Background: 15:1+ contrast ratio ✓
- Text Secondary on Background: 8:1+ contrast ratio ✓
- Accent colors on dark background: 7:1+ ratio ✓

### Focus Indicators
- All interactive elements must have visible focus state (outline or highlight)
- Minimum 2px visible outline in contrasting color
- No `outline: none` without alternative focus indicator

### Motion
- Respect `prefers-reduced-motion` media query
- Disable animations for users with motion sensitivity

---

## Responsive Design

### Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| Mobile | 360px - 640px | Phone devices |
| Tablet | 641px - 1024px | Tablets, small laptops |
| Desktop | 1025px+ | Desktop, large screens |

### Fluid Scaling
- Use `clamp()` for font sizes on medium screens
- Stack layouts on mobile, columns on desktop
- Full width on mobile, max-width container on desktop

---

## Implementation Guidelines

1. **Use SCSS variables** for all colors and spacing (see `_variables.scss`)
2. **BEM naming convention** for CSS classes: `.component__element--modifier`
3. **Mobile-first** approach: design for mobile, enhance for desktop
4. **60-30-10 rule**: 60% primary background, 30% secondary colors, 10% accents
5. **No inline styles** - all styling in `.scss` or `.module.scss` files
6. **Component libraries** encouraged (e.g., headless UI for modals, menus)

---

## Color Usage Examples

### Dashboard Card (User's Game Status)
- Background: `#1e293b`
- Header: `#3b82f6` (if active), `#10b981` (if won), `#ef4444` (if lost)
- Text: `#f1f5f9`
- Border: `#334155`

### Game Board
- Active cell for Player X: `#3b82f6`
- Active cell for Player O: `#f59e0b`
- Winning pattern highlight: `#10b981`
- Forced corner border: `#06b6d4`

### Form Validation
- Error message text: `#fca5a5`
- Success message text: `#6ee7b7`
- Input border on error: `#ef4444`

### Navigation
- Current page: `#3b82f6` with underline
- Hover: `#cbd5e1` text, no background change
- Inactive: `#94a3b8`
