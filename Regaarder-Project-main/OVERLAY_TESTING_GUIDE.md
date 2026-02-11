# Ad Overlay Testing Guide

## Current Status: ✅ INTEGRATION COMPLETE

### What Has Been Integrated:

1. **AdOverlayManager Component** (`src/AdOverlayManager.jsx`)
   - Professional two-column UI with editor (left) and live preview (right)
   - Create, edit, and delete ad overlays
   - Live preview with playback controls
   - Real-time overlay rendering on video
   - Timeline with overlay markers
   - Backend persistence via PUT `/staff/videos/{videoId}`

2. **StaffDashboard Integration** (`src/StaffDashboard.jsx`)
   - Imported AdOverlayManager component
   - Positioned in Ads tab section
   - Passes required props: `videos`, `videoId`, `videoUrl`, `videoDuration`, `existingOverlays`, `onOverlaysSave`, `onSelectVideo`, `staffSession`

3. **Videoplayer Support** (`src/Videoplayer.jsx`)
   - Already supports overlay loading from `videoInfo.overlays`
   - Correctly filters overlays by `timeSec` and `durationSec`
   - Renders link overlays (with color and hover effects)
   - Renders image overlays (base64 or URL)
   - Positions overlays using `positionX` and `positionY` (in pixels)

4. **Backend Endpoint** (`backend/server.js`)
   - PUT `/staff/videos/:videoId` accepts overlays array
   - Persists overlays to `backend/videos.json`
   - Survives server restarts

## Testing Procedure

### Prerequisites:
- Dev server running: `npm run dev` (Port 5174)
- Backend server running: `node backend/server.js` (Port 4000)
- At least one video in the database

### Step 1: Navigate to Staff Dashboard
1. Open `http://localhost:5174/`
2. Log in as staff/admin
3. Navigate to Ads tab in Staff Dashboard

### Step 2: Select a Video
1. In the AdOverlayManager, you should see a list of videos
2. Click on a video to select it for overlay editing

### Step 3: Create an Ad Overlay
1. In the Editor panel (left side):
   - Choose overlay type: "Link" or "Image"
   - For Link overlays:
     - Set Start Time (seconds)
     - Set Duration (seconds)
     - Set Position X and Y (pixels)
     - Enter URL to link to
     - Enter link text
     - Choose link color
   - For Image overlays:
     - Set Start Time (seconds)
     - Set Duration (seconds)
     - Set Position X and Y (pixels)
     - Upload image file
2. Click "Add Overlay"

### Step 4: Preview in Real-time
1. The Live Preview (right side) shows:
   - Video player with current frame
   - Play/Pause button
   - Timeline scrubber
   - Overlays rendered at correct positions and times
2. Use the timeline to seek to different points
3. Verify overlays appear at the correct time

### Step 5: Save to Backend
1. Click "Save All Overlays" button
2. Overlays are persisted to backend

### Step 6: Test Home Page Display
1. Log out of staff dashboard
2. Go to home page: `http://localhost:5174/`
3. Find the video you added overlays to
4. Click to play the video
5. **Verify**: When playback reaches the overlay's start time:
   - Link overlays appear with the correct color, text, and position
   - Image overlays appear with the correct size and position
   - Overlays display for the correct duration
   - Clicking on link overlays opens the URL

### Step 7: Edit and Update
1. Return to Staff Dashboard > Ads tab
2. Select the same video
3. Click on an overlay in the editor list to edit it
4. Modify the properties
5. Click "Update Overlay"
6. Click "Save All Overlays"
7. Return to home page and verify changes

## Expected Behavior

### Link Overlays:
- Appear as styled buttons with specified color
- Positioned at exact pixel coordinates
- Display for specified duration
- Clickable to open URL in new tab
- Hover effect: scale up 5%

### Image Overlays:
- Appear as images with 160px max dimension
- Positioned at exact pixel coordinates
- Display for specified duration
- Rounded corners and subtle shadow
- Not clickable (unless we add click-to-URL feature)

### Timing:
- Overlays start at `timeSec` (seconds)
- Overlays end at `timeSec + durationSec`
- Only visible during playback window

## Troubleshooting

### Overlays Not Appearing:
1. Check browser console for errors
2. Verify video has overlays in backend:
   - Open `backend/videos.json`
   - Search for video by ID
   - Check if `overlays` array exists and has content
3. Verify overlay properties:
   - `timeSec`: number (seconds)
   - `durationSec`: number (seconds)
   - `positionX`: number (pixels)
   - `positionY`: number (pixels)
   - `type`: "link" or "image"
   - For links: `url`, `linkText`, `linkColor`
   - For images: `imageData` (base64 or URL)

### Overlays In Wrong Position:
- `positionX` and `positionY` are pixel coordinates
- X: 0 = left edge, increases rightward
- Y: 0 = top edge, increases downward

### Image Overlays Not Loading:
- Check if `imageData` is valid base64 or URL
- Ensure CORS if using external URLs
- File browser should have captured as base64

## Property Reference

### Overlay Object Structure:
```javascript
{
  id: string,                  // Unique identifier
  timeSec: number,             // Start time in seconds
  durationSec: number,         // Duration in seconds
  type: 'link' | 'image',      // Overlay type
  positionX: number,           // X position in pixels (0 = left edge)
  positionY: number,           // Y position in pixels (0 = top edge)
  
  // Link-specific properties:
  url?: string,                // URL to open on click
  linkText?: string,           // Text to display on button
  linkColor?: string,          // Color code (e.g., '#FFD700')
  
  // Image-specific properties:
  imageData?: string,          // Base64-encoded image or URL
}
```

## Success Criteria

✅ **Overlays are created in staff dashboard**
✅ **Overlays are saved to backend (videos.json)**
✅ **Overlays appear on home page when video plays**
✅ **Overlays appear at correct times**
✅ **Overlays appear at correct positions**
✅ **Link overlays are clickable**
✅ **Image overlays display correctly**
✅ **Overlays persist after server restart**

