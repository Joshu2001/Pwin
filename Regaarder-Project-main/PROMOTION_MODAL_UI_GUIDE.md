# Promotion Modal UI - Metrics & Filtering System

## Visual Layout

### Promotion Modal - User Selection Section

```
┌─────────────────────────────────────────────────────────────────────┐
│ Send Promotion To                                              [▼]   │
│ (Dropdown showing: ● All Users / ○ Creators Only / ○ Select Users) │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 When "Select Users" is chosen:                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [ ] All users          [Filters] [Select Visible]                  │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Search users or creators...        [🔍]                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─ Advanced Filters (click to expand) ──────────────────────────┐ │
│  │ [✓] Creators only  [Category ▼]  [Subscription ▼]            │ │
│  │ [Request Activity ▼]  [Min Requests □]  [Min $/request □]   │ │
│  │ [Days Active □]                                              │ │
│  │                              [Reset Filters]                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  User Selection List:                                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ☑ John Doe                      💳 Has Plan                   │ │
│  │   john@example.com              📋 5 Created ✅ 3 Fulfilled   │ │
│  │                                 🎁 1 Free     🔥 Active       │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ ☐ Sarah Smith                   ✅ 12 Fulfilled              │ │
│  │   sarah@example.com             🔥 Active                     │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ ☐ Mike Johnson                  📋 8 Created                  │ │
│  │   mike@example.com              🎁 4 Free       (inactive)   │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ ☐ Lisa Chen                     (No activity tracked)         │ │
│  │   lisa@example.com                                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ✓ 2 users selected                                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Filter Dropdown Examples

### Subscription Filter
```
┌─ Subscription ──────────┐
│ ● All Plans             │
│ ○ Has Plan              │
│ ○ No Plan               │
└─────────────────────────┘
```

### Request Activity Filter
```
┌─ Request Activity ──────────────┐
│ ● All Activity                  │
│ ○ Created Requests              │
│ ○ Fulfilled Requests            │
│ ○ Made Free Requests            │
│ ○ No Request Activity           │
└─────────────────────────────────┘
```

## Activity Badges (In User Card)

### Badge Styling

```
┌─────────────────────────────────┐
│ ☑ John Doe                      │
│   john@example.com              │
│   💳 Has Plan   📋 5 Created    │  ← Light colors
│   ✅ 3 Fulfilled  🎁 1 Free     │     Rounded corners
│   🔥 Active                      │     Small font
└─────────────────────────────────┘
```

### Badge Variants

| Badge Style | Meaning | Hex Colors |
|---|---|---|
| <span style="background: #dbeafe; color: #0369a1; padding: 2px 6px; border-radius: 3px;">💳 Has Plan</span> | User has paid subscription | BG: #dbeafe<br/>Text: #0369a1 |
| <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px;">📋 5 Created</span> | User created 5+ requests | BG: #fef3c7<br/>Text: #92400e |
| <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 3px;">✅ 3 Fulfilled</span> | User fulfilled 3+ requests | BG: #dcfce7<br/>Text: #166534 |
| <span style="background: #fce7f3; color: #831843; padding: 2px 6px; border-radius: 3px;">🎁 1 Free</span> | User made 1+ free requests | BG: #fce7f3<br/>Text: #831843 |
| <span style="background: #d1d5db; color: #111; padding: 2px 6px; border-radius: 3px;">🔥 Active</span> | User active last 7 days | BG: #d1d5db<br/>Text: #111 |

## Responsive Filter Grid

### On Large Screens (6 columns)
```
┌────────────────┬────────────────┬────────────────┬────────────────┬────────────────┬────────────────┐
│ Creators only  │ Category ▼     │ Subscription ▼ │ Request Act ▼  │ Min Requests □ │ Min $/req □    │
├────────────────┼────────────────┼────────────────┼────────────────┼────────────────┼────────────────┤
│ Days Active □  │ [Reset Filters]│                │                │                │                │
└────────────────┴────────────────┴────────────────┴────────────────┴────────────────┴────────────────┘
```

### On Medium Screens (3 columns)
```
┌────────────────┬────────────────┬────────────────┐
│ Creators only  │ Category ▼     │ Subscription ▼ │
├────────────────┼────────────────┼────────────────┤
│ Request Act ▼  │ Min Requests □ │ Min $/req □    │
├────────────────┼────────────────┼────────────────┤
│ Days Active □  │ [Reset Filters]│                │
└────────────────┴────────────────┴────────────────┘
```

### On Small Screens (2 columns)
```
┌────────────────┬────────────────┐
│ Creators only  │ Category ▼     │
├────────────────┼────────────────┤
│ Subscription ▼ │ Request Act ▼  │
├────────────────┼────────────────┤
│ Min Requests □ │ Min $/req □    │
├────────────────┼────────────────┤
│ Days Active □  │ [Reset Filters]│
└────────────────┴────────────────┘
```

## Color Scheme

### Main UI Colors
- **Background**: #f3f4f6 (light gray)
- **Border**: #e5e7eb (lighter gray)
- **Text Primary**: #1f2937 (dark gray)
- **Text Secondary**: #666 (medium gray)
- **Text Tertiary**: #9ca3af (light gray)

### Interactive Colors
- **Primary Button**: #f59e0b (amber/orange)
- **Filter Active**: #3b82f6 (blue)
- **Selected Item**: #dbeafe (light blue background)
- **Text on Blue**: #0369a1 (dark blue)

### Badge Colors
- **Blue Badges**: BG #dbeafe, Text #0369a1
- **Yellow Badges**: BG #fef3c7, Text #92400e
- **Green Badges**: BG #dcfce7, Text #166534
- **Pink Badges**: BG #fce7f3, Text #831843
- **Gray Badges**: BG #d1d5db, Text #111

## Spacing & Typography

### Font Sizes
- Filter Labels: 13px
- Input Fields: 12-13px
- Badge Text: 10px
- User Name: 13px (bold 600)
- User Email: 12px

### Padding/Margins
- Filter Section: 12px padding
- Badge: 2px vertical, 6px horizontal
- User Card: 12px padding vertical, 16px horizontal
- Border Radius: 6px (most elements), 3px (badges)

## Interaction States

### Filter Hover
```
Default:     #f3f4f6 background
Hover:       #e5e7eb background (slightly darker)
Active:      #3b82f6 background, white text
```

### User Card Hover
```
Not Selected: transparent → #f3f4f6 on hover
Selected:     #dbeafe (stays highlighted)
```

### Button Hover
```
Default:     100% opacity
Hover:       90% opacity
Active:      85% opacity
```

## Accessibility Features

1. **Semantic HTML**: Uses proper `<label>`, `<input>`, `<select>` elements
2. **Color Contrast**: All text meets WCAG AA standards
3. **Focus States**: Input fields have clear 2px borders when focused
4. **Disabled States**: Unavailable options have reduced opacity (0.5-0.6)
5. **ARIA Labels**: Buttons have aria-label attributes for screen readers
6. **Keyboard Navigation**: All filters/buttons are keyboard accessible

## Example Filter Combinations

### Scenario 1: VIP Creator Program
```
Filters Applied:
- Creators Only: ✓
- Subscription: Has Plan
- Days Active: 7 days

Result: Recent premium creators to reward
```

### Scenario 2: New User Welcome Campaign
```
Filters Applied:
- Days Active: 30 days
- Request Activity: No Request Activity
- Subscription: No Plan

Result: New users who haven't engaged yet
```

### Scenario 3: High-Engagement Feature Announcement
```
Filters Applied:
- Request Activity: Created Requests
- Days Active: 14 days
- Min Requests: 3

Result: Highly engaged users creating content
```

## Mobile Responsiveness

### Breakpoints
- **Mobile** (< 640px): 1-2 columns, stacked layout
- **Tablet** (640px - 1024px): 2-3 columns
- **Desktop** (> 1024px): 3-6 columns, auto-fit grid

### Mobile Optimizations
- Larger touch targets (minimum 44px)
- Full-width input fields
- Dropdowns expand full width
- Reduced padding on mobile (8px instead of 12px)
- Single-column badge layout on very small screens
