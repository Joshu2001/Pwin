# Ad System Visual Examples

## 1. Video Ad Display Example

```
┌────────────────────────────────────────────────┐
│ 🔒 Video Playing Area (9/16 aspect)           │
│                                                │
│    ┌──────────────────────────────────┐       │
│    │  Blue Gradient Overlay (9/16)    │       │
│    │                                  │       │
│    │  ┌────────────────────────────┐ │       │
│    │  │   🎬 Ad Video Placeholder  │ │       │
│    │  └────────────────────────────┘ │       │
│    │                                  │       │
│    │      Premium Tech Gadget        │       │
│    │                                  │       │
│    │     [Discover Now] (Button)     │       │
│    │      (Custom Blue Color)        │       │
│    │                                  │       │
│    └──────────────────────────────────┘       │
│                                                │
│  (Click anywhere to open link in new tab)     │
└────────────────────────────────────────────────┘

Styling:
- Full screen overlay: rgba(0, 0, 0, 0.95)
- Container: 9:16 aspect, max-width 400px
- Gradient: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)
- Button: Dynamic color from videoAdCtaColor
```

## 2. Default 2 Ad Display Example

```
┌────────────────────────────────────────────────┐
│ 🔒 Video Playing Area (9/16 aspect)           │
│                                                │
│                                                │
│                                                │
│                                                │
│                                                │
│                    [Visit Link] ◄─ Corner     │
│                   (Bottom-Right)              │
│                                                │
│                                                │
│ Cards Section:                                 │
│ ┌──────────────────────────────────────────┐ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ ┌──────────┐                             │ │
│ │ │  Logo    │ Exclusive Deal         →   │ │
│ │ │ (50x50)  │ Get 50% off today only     │ │
│ │ └──────────┘                             │ │
│ │                                          │ │
│ │ ┌──────────┐                             │ │
│ │ │  Logo    │ Exclusive Deal         →   │ │
│ │ │ (50x50)  │ Get 50% off today only     │ │
│ │ └──────────┘                             │ │
│ └──────────────────────────────────────────┘ │
│                                                │
│  (Click to open link in new tab)              │
└────────────────────────────────────────────────┘

Styling:
- Background: White (customizable via default2BgColor)
- Text color: Dark gray (customizable via default2TextColor)
- Left border: Magenta (customizable via default2LineColor)
- Logo: 50x50px, rounded corners
- Corner button: Float top-right with shadow
```

## 3. Overlay Ad - Ticker Style Example

```
Bottom of Screen:
┌─────────────────────────────────────────────┐
│ 🔥 Breaking News  |  Live Updates: 🎬 Check │
│                   out our latest announc... │
└─────────────────────────────────────────────┘

Styling:
- Position: Fixed bottom (100px from bottom)
- Background: #E41E24 (red)
- Text color: White
- Emoji badge: Left side (🔥)
- Animation: Marquee scroll from right to left
- Opacity: 0.95 (customizable)
```

## 4. Overlay Ad - Full Screen Example

```
┌────────────────────────────────────────────────┐
│                                                │
│          🔥 Breaking News                     │
│                                                │
│                                                │
│    Live Updates: 🎬 Check out our             │
│    latest announcement now!                   │
│                                                │
│                                                │
│                                                │
│  (Click anywhere to open link in new tab)     │
│                                                │
└────────────────────────────────────────────────┘

Styling:
- Full viewport: Takes entire screen
- Background: #E41E24 (red - customizable)
- Text color: White (customizable)
- Badge: Centered at top with emoji
- Messages: Large, centered text (24px)
- Opacity: Customizable (default 0.95)
```

## 5. Bottom Ad - Generic Card Example

```
Bottom Ad Bar (Fixed, Above Controls):
┌───────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐  │
│  │ [Logo]  Tesla Motors          →             │  │
│  │ 48x48   Order your New car now!             │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │ [Logo]  Nike                  →             │  │
│  │ 48x48   Just Do It - Shop Now!              │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘

Styling:
- Background: rgba(0, 0, 0, 0.95) - Dark semi-transparent
- Border top: 2px solid magenta
- Cards: Horizontal scroll
- Logo: 48x48px rounded
- Hover: Slight background brightening
```

## Color Customization Examples

### Video Ad
```javascript
// Blue CTA button (default)
videoAdCtaColor: '#0b74de'

// Red CTA button
videoAdCtaColor: '#dc2626'

// Green CTA button
videoAdCtaColor: '#16a34a'

// Custom gradient automatically applied:
// linear-gradient(135deg, [color] 0%, [color]dd 100%)
```

### Default 2 Ad
```javascript
// Brand colors example 1 - Dark theme
{
  default2BgColor: '#1f2937',
  default2TextColor: '#ffffff',
  default2LineColor: '#3b82f6'
}

// Brand colors example 2 - Light theme
{
  default2BgColor: '#ffffff',
  default2TextColor: '#111827',
  default2LineColor: '#d946ef'
}

// Brand colors example 3 - Green theme
{
  default2BgColor: '#ecfdf5',
  default2TextColor: '#065f46',
  default2LineColor: '#10b981'
}
```

### Overlay Ad
```javascript
// Breaking News (Red)
{
  overlayAdBgColor: '#E41E24',
  overlayAdTextColor: '#ffffff',
  overlayAdEmoji: '🔥'
}

// Alert/Announcement (Yellow)
{
  overlayAdBgColor: '#FBBF24',
  overlayAdTextColor: '#78350F',
  overlayAdEmoji: '🚨'
}

// Good News (Green)
{
  overlayAdBgColor: '#10b981',
  overlayAdTextColor: '#ffffff',
  overlayAdEmoji: '⭐'
}
```

## Size Specifications

```
CONTAINER DIMENSIONS:
├── Aspect Ratio: 9:16 (portrait)
├── Max Width: 400px
├── Max Height: 90vh (full screen max)
└── Responsive: Scales down on mobile

COMPONENT SIZES:
├── Video Ad Overlay: Full container
├── Default 2 Logo: 50x50px
├── Bottom Ad Logo: 48x48px
├── Corner Button: 10px padding vertical, 16px horizontal
└── Ticker Height: 50-60px approx

TEXT SIZES:
├── Video Ad Title: 16px (font-weight: 700)
├── Video Ad Button: 14px (font-weight: 700)
├── Default 2 Title: 13px (font-weight: 700)
├── Default 2 Description: 12px (regular)
├── Overlay Headline: 18px (font-weight: 700)
├── Overlay Full Screen: 24px (font-weight: 700)
└── Bottom Ad Name: 13px (font-weight: 600)
```

## Z-Index Stack (Top to Bottom)

```
Layer 4: Fixed Overlays (z-index: 50)
         ├── Video Ads
         ├── Default 2 Ads
         └── Overlay Ads (fullscreen mode)

Layer 3: Ticker Overlays (z-index: 40)
         └── Overlay Ads (top/bottom ticker mode)

Layer 2: Bottom Ad Bar (z-index: 38)
         └── Generic Bottom Ads

Layer 1: Video Player (z-index: 0-30)
         └── Main video content

Layer 0: Background (z-index: -1)
         └── Page background
```

## Animation Examples

### Video Ad CTA Button Hover
```
Before Hover:
┌──────────────────┐
│  Discover Now    │
│  transform: none │
│  box-shadow: ... │
└──────────────────┘

On Hover:
┌──────────────────┐
│  Discover Now    │
│  ↑ (2px up)      │
│  transform: ...  │
│  box-shadow: ... │ (enhanced)
└──────────────────┘
```

### Overlay Marquee Animation
```
Start:  "Message 1 | Message 2 | Message 1 | Message 2 | ░░░"
        ════════════════════════════════════════════════════

30%:    "Message ░░░░░░░░░░░░░░ Message 2 | Message 1 | Mes"
        ════════════════════════════════════════════════════

70%:    "░░░░░░░░░░░ Message 1 | Message 2 | Message 1 | Msg"
        ════════════════════════════════════════════════════

End:    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░"
        (Repeats continuously)
```

## Responsive Behavior

### Desktop (1024px+)
- Fixed width: 400px
- Full screen overlay: Centered
- No scaling needed

### Tablet (768px - 1023px)
- Fixed width: 80% or 400px (whichever is smaller)
- Slight padding adjustment
- Same z-index behavior

### Mobile (< 768px)
- Width: 100% - 40px padding
- Max width: 400px
- Respects safe-area-inset
- Touch-friendly click targets
- Overflow scroll for long cards

---

**Visual Layout Complete** - All examples show exact design matching preview modals
