# 🎯 Quick Reference: Request Card Outline System

## At a Glance

### Default Styling
```
All Request Cards:
├─ Border: 1px grey (#9ca3af)
├─ Background: White
├─ Display: Subtle visual separation
└─ Status: Normal/unemphasized
```

### Automatic Purple Accent (Boosted Requests)
```
When boosts >= 1:
├─ Border: 2px purple (#9333ea) 
├─ Background: Light purple tint (5% opacity)
├─ Badge: 🔊 Boosted
├─ Status: Visually prominent
└─ Admin Action: None required
```

### Manual Purple Accent (Admin Selection)
```
When admin clicks "Select":
├─ Border: 2px purple (#9333ea)
├─ Background: Light purple tint (5% opacity) 
├─ Badge: 👑 Admin Selected
├─ Button: Shows "Selected" (purple)
└─ Admin Action: Click to toggle on/off
```

## Status Legend

| Status | Icon | Color | Border | Auto |
|--------|------|-------|--------|------|
| Normal | — | Grey | 1px | ✅ |
| Boosted | 🔊 | Purple | 2px | ✅ |
| Selected | 👑 | Purple | 2px | Manual |
| Hidden | 👁️ | Amber | 2px | ✅ |
| Deleted | 🗑️ | Violet | 2px | ✅ |

## Color Codes

```
Primary Accent:     #9333ea (Purple)
Grey Outline:       #9ca3af (Gray)
Hidden:             #f59e0b (Amber)
Deleted:            #a855f7 (Violet)
Light Tint (5%):    rgba(147, 51, 234, 0.05)
```

## Admin Controls

### The "Select" Button

```
LOCATION: Right side of request card

INACTIVE (unselected):
┌─────────────┐
│ 👑 Select   │ ← White bg, purple text
└─────────────┘

ACTIVE (selected):
┌─────────────┐
│ 👑 Selected │ ← Purple bg, white text
└─────────────┘

ACTION: Click to toggle on/off
```

## Key Features Checklist

- ✅ All requests have grey outline by default
- ✅ Boosted requests (boosts >= 1) show purple accent
- ✅ Admin can manually select requests for accent color
- ✅ "Boosted" badge shows on boosted requests
- ✅ "Admin Selected" badge shows on selected requests
- ✅ Boost count displayed in statistics
- ✅ Smooth transitions and hover effects
- ✅ Works on all non-hidden/non-deleted requests

## File Location

**Implementation File**: `src/StaffDashboard.jsx`

**Key Code Sections**:
- Line 589: State initialization
- Lines 2703-2730: Border/background logic
- Lines 2752-2798: Badge display
- Lines 2844-2874: Selection button

## Implementation Status

✅ **COMPLETE** - Ready for Production

**Last Build**: Successful (Vite)
**Errors**: None
**Warnings**: None (related to this feature)

## How to Test

1. Go to Admin Panel → Requests Tab
2. Look for requests with `boosts >= 1` → should have purple border
3. Click "Select" button on any request → changes to purple
4. Click again → reverts to grey
5. Hover over button → see color transitions
6. Check stats line → should see boost count

## Common Questions

**Q: Why is the border grey?**
A: Subtle grey outline provides visual separation without drawing attention away from content.

**Q: How do boosted requests get purple border?**
A: Automatically when request data has `boosts >= 1`. No admin action needed.

**Q: Can I save my selections?**
A: Currently selections persist during your admin session. Future versions can add database persistence.

**Q: What if a request is both boosted AND I select it?**
A: It shows purple accent either way. The badge changes from "Boosted" to "Admin Selected" when you select it.

**Q: Does selection affect the request data?**
A: No, selection is visual only. It doesn't modify the actual request in the database.

**Q: Can I bulk select multiple requests?**
A: Not currently, but could be added as a future enhancement.

---

**Quick Links**:
- [Full Implementation Details](REQUEST_CARD_OUTLINE_IMPLEMENTATION.md)
- [Visual Design Guide](REQUEST_CARD_VISUAL_GUIDE.md)
- [Complete Summary](REQUEST_OUTLINE_SUMMARY.md)

**Version**: 1.0 | **Status**: ✅ Production Ready
