# Request Card Outline Enhancement Implementation

## Overview
Added visual highlighting system for request cards in the Admin Panel with grey outlines for all requests and accent color outlines for boosted requests and admin-selected requests.

## Changes Implemented

### 1. State Management
**File**: [src/StaffDashboard.jsx](src/StaffDashboard.jsx#L589)

Added new state to track which requests should have accent color outlines:
```javascript
const [requestAccentColorSelection, setRequestAccentColorSelection] = useState({});
```

This object stores request IDs where admin has manually selected accent color highlighting.

### 2. Request Card Styling
**File**: [src/StaffDashboard.jsx](src/StaffDashboard.jsx#L2703-L2730)

Enhanced request card rendering with intelligent border logic:

#### Border Color Rules (Priority Order):
1. **Hidden requests**: Orange border (2px) - `#f59e0b`
2. **Deleted requests**: Purple border (2px) - `#a855f7`
3. **Boosted OR Admin-Selected requests**: Purple accent border (2px) - `#9333ea`
4. **All other requests**: Grey outline (1px) - `#9ca3af`

#### Background Color Rules:
- **Boosted or Selected**: Light purple tint (5% opacity) for visual hierarchy
- **Normal**: White background
- **Hidden**: Light yellow background
- **Deleted**: Light purple background

```javascript
const isSelected = requestAccentColorSelection[req.id];
const isBoosted = (req.boosts || 0) >= 1;
const useAccentBorder = isSelected || isBoosted;
const accentColor = '#9333ea'; // Purple accent from theme
```

### 3. Status Badges
**File**: [src/StaffDashboard.jsx](src/StaffDashboard.jsx#L2752-L2798)

Added new status badges:

- **Boosted Badge**: Displayed for requests with 1+ boosts (only when not manually selected)
  - Icon: Megaphone
  - Color: Purple accent
  
- **Admin Selected Badge**: Displayed when admin manually selects accent color
  - Icon: Crown
  - Color: Purple accent

### 4. Admin Control Button
**File**: [src/StaffDashboard.jsx](src/StaffDashboard.jsx#L2844-2874)

Added "Select" button that allows admins to:
- Toggle accent color outline on/off per request
- Button shows "Select" when inactive, "Selected" when active
- Active state: Purple background with white text
- Inactive state: White background with purple text
- Hover effects with color transitions

Button Features:
- Crown icon indicator
- Smooth transitions
- Tooltip: "Toggle accent color outline for this request"
- Works on all non-hidden, non-deleted requests

### 5. Boost Count Display
**File**: [src/StaffDashboard.jsx](src/StaffDashboard.jsx#L2814)

Updated stats display to show boost count:
```
Likes: X | Comments: Y | Boosts: Z
```

## Visual Design

### Color Scheme
- **Accent Color**: `#9333ea` (Purple) - Theme default
- **Grey Outline**: `#9ca3af` (Medium Gray)
- **Hidden**: `#f59e0b` (Amber)
- **Deleted**: `#a855f7` (Violet)

### Border Styles
- **Normal requests**: 1px solid grey
- **Highlighted requests**: 2px solid accent color
- **Special states**: 2px solid (hidden/deleted color)

### Background Effects
- **Normal**: White
- **Highlighted**: 5% opacity accent color (subtle tint)
- **Interactive**: Smooth 0.2s transitions

## Features

### 1. Grey Outlines on All Requests ✓
- Every request card displays a subtle grey outline
- Maintains visual separation and readability
- 1px width for minimal visual weight

### 2. Accent Color for Boosted Requests ✓
- Requests with `boosts >= 1` automatically get accent border
- Purple border (2px) + purple tint background
- "Boosted" badge with megaphone icon
- No additional admin action needed

### 3. Admin Selection System ✓
- Crown button on each active request
- Click to toggle accent color outline
- Visual feedback: Button changes color when selected
- Selection state persists during admin session
- Works independently of boost status

### 4. Visual Hierarchy ✓
- Critical states (hidden/deleted) take priority
- Accent highlighting visible but non-intrusive
- Clear status badges for quick identification
- Smooth transitions for interactive elements

## Technical Details

### State Management
- Selection data stored in React component state
- Non-persistent (resets on page refresh)
- Can be extended to persist to backend if needed

### Performance
- Efficient conditional rendering
- Minimal re-renders with proper key usage
- CSS transitions for smooth UX

### Accessibility
- Proper button labels and tooltips
- Icon + text badges for clarity
- Color + text differentiation (not color alone)
- Adequate contrast ratios maintained

## How to Use

### For Admin Staff:
1. **View All Requests**: Navigate to Admin Panel → Requests tab
2. **Identify Boosted Requests**: Look for "Boosted" badge with megaphone icon
3. **Highlight Outstanding Requests**: Click the "Select" button on any request
   - Button turns purple when selected
   - "Admin Selected" badge appears
   - Purple outline highlights the card
4. **Remove Highlight**: Click "Selected" button again to deselect

## Examples

### Default Request (Grey Outline)
```
╭─────────────────────────────────╮
│ Title: New Video Request        │ ← Grey 1px border
│ Requester: John                 │
│ Likes: 5 | Comments: 2 | B: 0   │
│ [Action]          [Select]      │
╰─────────────────────────────────╯
```

### Boosted Request (Purple Accent)
```
╭═════════════════════════════════╮
│ 🔊 Boosted                      │ ← "Boosted" badge
│ Title: Popular Request          │
│ Requester: Jane                 │ ← Purple 2px border
│ Likes: 50 | Comments: 10 | B: 3 │ ← Light purple tint background
│ [Action]          [Select]      │
╰═════════════════════════════════╯
```

### Admin-Selected Request (Purple Accent)
```
╭═════════════════════════════════╮
│ 👑 Admin Selected               │ ← "Admin Selected" badge
│ Title: Outstanding Request      │
│ Requester: Bob                  │ ← Purple 2px border
│ Likes: 8 | Comments: 1 | B: 0   │ ← Light purple tint background
│ [Action]          [Selected]    │ ← Button is purple
╰═════════════════════════════════╯
```

## Future Enhancements

### Possible Additions:
1. **Backend Persistence**: Save admin selections to database
2. **Multiple Accent Colors**: Allow custom color selection per request
3. **Filter by Highlight Status**: "Show only selected requests"
4. **Bulk Selection**: Multi-select feature for batch operations
5. **Comments**: Add admin notes explaining why request was selected
6. **Sorting**: Sort by boost count or selection status

## Testing Checklist

- [x] Build compiles without errors
- [x] Grey outlines visible on all request cards
- [x] Boosted requests show purple border automatically
- [x] Admin selection button toggles properly
- [x] Status badges display correctly
- [x] Boost count shows in statistics
- [x] Hover effects work smoothly
- [x] No visual regressions on other elements

## File Modified
- [src/StaffDashboard.jsx](src/StaffDashboard.jsx)

## Build Status
✅ Successfully compiled with Vite (no errors or warnings related to these changes)
