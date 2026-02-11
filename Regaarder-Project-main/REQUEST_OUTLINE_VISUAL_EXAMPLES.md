# 🎨 Request Card Outline System - Visual Examples

## Complete Visual Walkthrough

### Example 1: Normal Request (Grey Outline)

```
╔════════════════════════════════════════════════════════════╗
║                   REQUEST CARD                             ║
║  ┌──────────────────────────────────────────────────────┐  ║
║  │                                                      │  ║
║  │  Title: "Create Educational Video Series"           │  ║
║  │                                                      │  ║
║  │  Requester: Tech Corp                               │  ║
║  │  Likes: 12 | Comments: 3 | Boosts: 0               │  ║
║  │  Created: 1/24/2026, 2:30 PM                        │  ║
║  │                                                      │  ║
║  │         [Action]              [Select]              │  ║
║  │                                                      │  ║
║  └──────────────────────────────────────────────────────┘  ║
║        ▲                                                     ║
║        │                                                     ║
║    Grey 1px border (#9ca3af)                               ║
║    White background                                         ║
║    No special badges                                        ║
╚════════════════════════════════════════════════════════════╝

DEFAULT STATE
Background: #ffffff (White)
Border: 1px solid #9ca3af (Grey)
Appearance: Subtle, minimal emphasis
```

---

### Example 2: Boosted Request (Auto Purple Accent)

```
╔════════════════════════════════════════════════════════════╗
║                   REQUEST CARD                             ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃  🔊 Boosted                                        ┃  ║
║  ┃                                                    ┃  ║
║  ┃  Title: "Viral Dance Challenge Collaboration"     ┃  ║
║  ┃                                                    ┃  ║
║  ┃  Requester: Dance Studio Pro                      ┃  ║
║  ┃  Likes: 156 | Comments: 42 | Boosts: 5           ┃  ║
║  ┃  Created: 1/20/2026, 10:15 AM                     ┃  ║
║  ┃                                                    ┃  ║
║  ┃         [Action]              [Select]            ┃  ║
║  ┃                                                    ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║        ▲                                                    ║
║        │                                                    ║
║    Purple 2px border (#9333ea)                            ║
║    Light purple tint background (5% opacity)              ║
║    "🔊 Boosted" badge displayed                           ║
║    Automatically applied (boosts >= 1)                     ║
╚════════════════════════════════════════════════════════════╝

BOOSTED STATE (Automatic)
Background: rgba(147, 51, 234, 0.05) (5% purple tint)
Border: 2px solid #9333ea (Purple)
Badge: 🔊 Boosted
Appearance: Prominent, highlights popular requests
Auto-triggered: When boosts >= 1
```

---

### Example 3: Admin-Selected Request (Manual Purple Accent)

```
╔════════════════════════════════════════════════════════════╗
║                   REQUEST CARD                             ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃  👑 Admin Selected                                 ┃  ║
║  ┃                                                    ┃  ║
║  ┃  Title: "Important Collaboration Opportunity"     ┃  ║
║  ┃                                                    ┃  ║
║  ┃  Requester: MediaCorp Inc                         ┃  ║
║  ┃  Likes: 8 | Comments: 1 | Boosts: 0              ┃  ║
║  ┃  Created: 1/23/2026, 9:45 AM                      ┃  ║
║  ┃                                                    ┃  ║
║  ┃         [Action]           [Selected]             ┃  ║
║  ┃                             (Purple Bg)           ┃  ║
║  ┃                                                    ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║        ▲                                                    ║
║        │                                                    ║
║    Purple 2px border (#9333ea)                            ║
║    Light purple tint background (5% opacity)              ║
║    "👑 Admin Selected" badge displayed                    ║
║    "Selected" button turns purple                         ║
║    Manually activated by admin                            ║
╚════════════════════════════════════════════════════════════╝

ADMIN-SELECTED STATE (Manual)
Background: rgba(147, 51, 234, 0.05) (5% purple tint)
Border: 2px solid #9333ea (Purple)
Badge: 👑 Admin Selected
Button: [👑 Selected] with purple background
Appearance: Important, prioritized by admin
Trigger: Admin clicks "Select" button
```

---

### Example 4: Hidden Request (Special State)

```
╔════════════════════════════════════════════════════════════╗
║                   REQUEST CARD                             ║
║  ╭────────────────────────────────────────────────────╮    ║
║  │  👁️ Hidden                                         │    ║
║  │                                                    │    ║
║  │  Title: "Sensitive Content Request"               │    ║
║  │                                                    │    ║
║  │  Requester: Anonymous User                        │    ║
║  │  Likes: 0 | Comments: 0 | Boosts: 0              │    ║
║  │  Created: 1/22/2026, 3:20 PM                      │    ║
║  │                                                    │    ║
║  │         [Undo]                                     │    ║
║  │                                                    │    ║
║  ╰────────────────────────────────────────────────────╯    ║
║        ▲                                                    ║
║        │                                                    ║
║    Amber 2px border (#f59e0b)                             ║
║    Light yellow background                                 ║
║    "👁️ Hidden" badge displayed                             ║
║    Priority over other styling                             ║
║                                                             ║
║  Note: "Action" button replaced with "Undo" button        ║
╚════════════════════════════════════════════════════════════╝

HIDDEN STATE (Priority Override)
Background: #fef3c7 (Light yellow)
Border: 2px solid #f59e0b (Amber)
Badge: 👁️ Hidden
Button: [Undo] to restore visibility
Appearance: Warning, indicates hidden content
Visibility: Still visible to admins only
```

---

### Example 5: Deleted Request (Special State)

```
╔════════════════════════════════════════════════════════════╗
║                   REQUEST CARD                             ║
║  ╭─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╮  ║
║  │  🗑️ Deleted                                         │  ║
║  │                                                    │  ║
║  │  Title: "Removed Request"                         │  ║
║  │                                                    │  ║
║  │  Requester: Deleted Account                       │  ║
║  │  Likes: 0 | Comments: 0 | Boosts: 0              │  ║
║  │  Created: 1/15/2026, 11:00 AM                     │  ║
║  │                                                    │  ║
║  │         [Undo]                                     │  ║
║  │                                                    │  ║
║  ╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╯  ║
║        ▲                                                    ║
║        │                                                    ║
║    Violet 2px border (#a855f7) (dashed style)             ║
║    Light purple background                                 ║
║    "🗑️ Deleted" badge displayed                            ║
║    Priority over other styling                             ║
║                                                             ║
║  Note: Content still recoverable via "Undo"               ║
╚════════════════════════════════════════════════════════════╝

DELETED STATE (Priority Override)
Background: #faf5ff (Light purple)
Border: 2px solid #a855f7 (Violet)
Badge: 🗑️ Deleted
Button: [Undo] to restore
Appearance: Danger, indicates deleted content
Visibility: Still visible to admins only
```

---

## Button State Transitions

### "Select" Button States

```
STEP 1: INACTIVE (Normal Request)
┌──────────────────┐
│ 👑 Select        │
│ White bg         │
│ Purple text      │
│ Border: 2px      │
│ Border color: #9333ea
└──────────────────┘
       │ (User clicks)
       ▼

STEP 2: TRANSITIONING
┌──────────────────┐
│ 👑 Select        │
│ Light purple bg  │
│ Purple text      │
│ (Hover effect)   │
└──────────────────┘
       │ (Mouse released)
       ▼

STEP 3: ACTIVE (Selected)
┌──────────────────┐
│ 👑 Selected      │
│ Purple bg        │
│ White text       │
│ Border: 2px      │
│ Border color: #9333ea
└──────────────────┘
       │ (User clicks again)
       ▼

STEP 4: BACK TO INACTIVE
(Returns to STEP 1)
```

---

## Visual Hierarchy Demonstration

```
VISUAL EMPHASIS LEVELS
═══════════════════════════════════════════════════════

LEVEL 1 - CRITICAL (Requires Action)
┌────────────────────────────────┐
│ 👁️ Hidden / 🗑️ Deleted         │ ← Special color + badge
│ Thick border (2px)             │
│ Colored background             │
└────────────────────────────────┘

LEVEL 2 - HIGH (Needs Attention)
┌────────────────────────────────┐
│ 👑 Admin Selected              │ ← Purple accent
│ 🔊 Boosted                     │ ← or boosted badge
│ Purple border (2px)            │
│ Light purple tint              │
└────────────────────────────────┘

LEVEL 3 - NORMAL (Standard)
┌────────────────────────────────┐
│ (No special badge)             │ ← Grey outline
│ Minimal styling                │
│ Grey border (1px)              │
│ White background               │
└────────────────────────────────┘
```

---

## Interaction Flow Diagram

```
ADMIN INTERACTION FLOW
═══════════════════════════════════════════════════════

START
  │
  ├─────► View Requests List
  │         (All with grey outlines)
  │
  ├─────► Scan for Boosted Requests
  │         ◄─ Purple border = Boosted
  │         ◄─ "🔊 Boosted" badge
  │
  ├─────► Identify Outstanding Requests
  │         (Low stats but important)
  │
  ├─────► Click "Select" Button
  │         │
  │         ├─ Button: Select → Selected
  │         ├─ Border: Grey → Purple
  │         ├─ Background: White → Light Purple
  │         └─ Badge: None → "👑 Admin Selected"
  │
  ├─────► Request Now Highlighted
  │         (Visible to other admins)
  │
  ├─────► Click "Selected" to Remove
  │         (Reverts to grey outline)
  │
  └─────► Continue Managing Other Requests

KEY DECISION POINTS:
- Has boosts? → Purple automatically
- Needs highlighting? → Click "Select"
- Click again? → Deselects
```

---

## Color Palette Reference

```
COLOR PALETTE VISUAL GUIDE
═══════════════════════════════════════════════════════

PRIMARY ACCENT
■ #9333ea (Purple)
  Used for: Boosted, Selected, Highlights
  Contrast: Excellent on white/grey
  Psychology: Prestige, Priority

GREY OUTLINE
■ #9ca3af (Gray-400)
  Used for: Default borders
  Used for: Subtle emphasis
  Psychology: Neutral, Professional

HIDDEN STATE
■ #f59e0b (Amber)
  Used for: Hidden request borders
  Used for: Warning indication
  Psychology: Caution, Attention needed

DELETED STATE  
■ #a855f7 (Violet)
  Used for: Deleted request borders
  Used for: Danger indication
  Psychology: Serious, Irreversible

BACKGROUNDS
─────────────────────────────────
White:    #ffffff (Normal)
Purple:   rgba(147, 51, 234, 0.05) (Highlighted)
Yellow:   #fef3c7 (Hidden)
Purple:   #faf5ff (Deleted)
```

---

## Usage Scenarios

### Scenario 1: Reviewing Popular Requests
```
Admin opens Requests tab
  ↓
Sees multiple requests with purple borders
  ↓
"🔊 Boosted" badges visible
  ↓
Quickly identifies trending requests
  ↓
Can prioritize responses accordingly
```

### Scenario 2: Managing Priority Requests
```
Admin finds important low-engagement request
  ↓
Clicks "Select" button
  ↓
Request card turns purple
  ↓
"👑 Admin Selected" badge appears
  ↓
Other admins see this was prioritized
  ↓
Team can coordinate on this request
```

### Scenario 3: Handling Problematic Content
```
Admin identifies inappropriate request
  ↓
Clicks "Action" → "Hide Request"
  ↓
Card border turns amber
  ↓
"👁️ Hidden" badge appears
  ↓
Request still visible to admins
  ↓
Hidden from public view
  ↓
Can be restored with "Undo"
```

---

**Visual Guide Version**: 1.0
**Status**: Complete & Ready
**Last Updated**: January 25, 2026
