# Request Card Outline System - Quick Reference Guide

## 🎨 Visual Overview

### Request Card Outline Status

```
┌─────────────────────────────────────────────────────┐
│                  OUTLINE COLORS                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🟢 NORMAL REQUESTS                                │
│  ├─ Border: Grey (1px) #9ca3af                    │
│  ├─ Background: White                             │
│  └─ Type: Light grey outline, minimal prominence  │
│                                                     │
│  🟣 BOOSTED REQUESTS (boosts >= 1)               │
│  ├─ Border: Purple (2px) #9333ea                 │
│  ├─ Background: Light purple (5% opacity)         │
│  ├─ Badge: 🔊 Boosted                            │
│  └─ Auto-applied: No admin action needed          │
│                                                     │
│  👑 ADMIN-SELECTED REQUESTS                       │
│  ├─ Border: Purple (2px) #9333ea                 │
│  ├─ Background: Light purple (5% opacity)         │
│  ├─ Badge: 👑 Admin Selected                      │
│  └─ Manual: Admin clicks "Select" button          │
│                                                     │
│  ⚠️  HIDDEN REQUESTS                               │
│  ├─ Border: Amber (2px) #f59e0b                  │
│  ├─ Background: Light yellow                      │
│  ├─ Badge: 👁️ Hidden                              │
│  └─ Priority: Overrides other styling             │
│                                                     │
│  🗑️  DELETED REQUESTS                              │
│  ├─ Border: Violet (2px) #a855f7                 │
│  ├─ Background: Light purple                      │
│  ├─ Badge: 🗑️ Deleted                             │
│  └─ Priority: Overrides other styling             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🎯 Admin Control Button

```
┌──────────────────────────────────────────────────┐
│           "SELECT" BUTTON STATES                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  INACTIVE (Request Not Selected):               │
│  ┌─────────────────┐                            │
│  │ 👑 Select       │ ← White bg, purple text   │
│  └─────────────────┘                            │
│  Hover: Light purple background                 │
│                                                  │
│  ACTIVE (Request Selected):                     │
│  ┌─────────────────┐                            │
│  │ 👑 Selected     │ ← Purple bg, white text   │
│  └─────────────────┘                            │
│  Hover: Darker purple background                │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 📊 Data Flow

```
┌─────────────────────────────────────┐
│  Request Data from Backend          │
│  {                                  │
│    id: "req_xxx",                   │
│    boosts: 2,              ──┐      │
│    hidden: false,            │      │
│    deleted: false            │      │
│  }                           │      │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Component Logic                    │
│                                     │
│  isBoosted = boosts >= 1     ◄──────┤
│  isSelected = state[id]             │
│  useAccent = boosted OR selected    │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Border Color Decision              │
│                                     │
│  if hidden  → Amber (2px)          │
│  if deleted → Violet (2px)         │
│  if accent  → Purple (2px)         │
│  else       → Grey (1px)           │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Display Request Card               │
│  with appropriate outline           │
└─────────────────────────────────────┘
```

## 🎮 User Interaction Flow

```
ADMIN WORKFLOW:
┌─────────────────────────┐
│  Browse Request Cards   │
│  (all with grey edges)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Identify Outstanding   │
│  or Boosted Requests    │
└───────────┬─────────────┘
            │
      ┌─────┴─────┐
      │           │
      ▼           ▼
  Boosted?    Need to
      │       Highlight?
      │           │
   Auto        Click
  Purple      "Select"
   Badge        │
                ▼
            Request Card
            Gets:
            ✓ Purple Border
            ✓ Purple Background
            ✓ "Selected" Badge
            ✓ Selection Button
              shows "Selected"
```

## 🔄 State Persistence

```
Current Implementation:
┌─────────────────────────────────┐
│  Selection stored in:           │
│  requestAccentColorSelection {}  │
│                                 │
│  Scope: Current Session Only    │
│  - Data resets on page refresh  │
│  - Lost when admin logs out     │
└─────────────────────────────────┘

For Persistence (Future):
┌─────────────────────────────────┐
│  Could save to backend:         │
│  {                              │
│    requestId: string,           │
│    selectedBy: adminId,         │
│    selectedAt: timestamp        │
│  }                              │
│                                 │
│  Then load on component mount   │
└─────────────────────────────────┘
```

## 📈 Badge Priority & Display

```
BADGE DISPLAY RULES:
═══════════════════════════════════════════

Status         Badge Shown?  Icon   Color
─────          ────────────  ────   ─────
Hidden         YES           👁️    Amber
Deleted        YES           🗑️    Violet
Boosted        IF NOT sel    🔊    Purple
Admin Sel.     IF sel.       👑    Purple

Example Combinations:
═══════════════════════════════════════════

1. Normal Request
   Badges: (none)
   Border: Grey 1px
   
2. Boosted Request
   Badges: 🔊 Boosted
   Border: Purple 2px
   
3. Boosted + Admin Selected
   Badges: 👑 Admin Selected
   Border: Purple 2px
   (Boosted badge hidden - only show Selected)
   
4. Hidden Request
   Badges: 👁️ Hidden
   Border: Amber 2px
   
5. Deleted Request
   Badges: 🗑️ Deleted
   Border: Violet 2px
```

## 🎨 Color Reference

```
COLOR PALETTE:
══════════════════════════════════════════

Accent/Primary:    #9333ea (Purple)
Grey Outline:      #9ca3af (Gray-400)
Hidden State:      #f59e0b (Amber)
Deleted State:     #a855f7 (Violet)

Light Tint (5%):   rgba(147, 51, 234, 0.05)

Border Widths:
  Normal: 1px
  Accent: 2px
  Special: 2px
```

## ✨ Key Features Summary

| Feature | Implementation | Status |
|---------|----------------|--------|
| Grey outlines on all requests | 1px grey border default | ✅ |
| Accent outline for boosted | Auto-applied when boosts >= 1 | ✅ |
| Admin selection system | Toggle button with state | ✅ |
| Visual badges | Status indicators | ✅ |
| Boost count display | Added to stats line | ✅ |
| Smooth transitions | CSS transitions on state change | ✅ |
| Hover effects | Interactive feedback | ✅ |

## 🚀 How to Test

1. **View Requests Tab** in Admin Panel
2. **Look for requests with boosts** - should have purple border
3. **Click "Select" button** on any request
4. **Verify changes**:
   - Button becomes purple
   - Card border turns purple  
   - "Admin Selected" badge appears
   - Background has light purple tint
5. **Click "Selected" button** to deselect
6. **Verify revert**:
   - Button returns to white
   - Card border becomes grey again
   - "Admin Selected" badge disappears

## 📋 Troubleshooting

| Issue | Solution |
|-------|----------|
| Grey outlines not visible | Ensure request is not hidden/deleted |
| Purple border not showing for boosted request | Check `boosts` field has value >= 1 in data |
| Selection button not working | Verify request is not in hidden/deleted state |
| Badge overlapping with text | All badges use flexbox, should auto-space |

---
**Last Updated**: Implementation Complete
**Version**: 1.0
**Status**: Ready for Production ✅
