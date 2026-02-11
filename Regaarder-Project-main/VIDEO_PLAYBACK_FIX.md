# Video Not Playing - Shows Generic Flower Video - FIXED

## Problem
When clicking on a published video from the home page:
- Thumbnail displays correctly ✓
- But clicking to watch shows a generic flower video instead of the uploaded video ✗
- The actual uploaded video doesn't play

## Root Cause

The `MobileVideoPlayer` component (default export in `Videoplayer.jsx`) was not reading URL parameters when videos were opened from the home page.

**The Flow:**
1. Home page navigates to: `/videoplayer?src=http://localhost:4000/uploads/video.mp4&title=...`
2. `MobileVideoPlayer` only checked the `initialVideo` **prop** (which wasn't provided)
3. Since no prop was passed, `videoUrl` state stayed empty `""`
4. Video tag fell back to hardcoded default: `"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"`

**Code Evidence:**
```javascript
// Line 3196 - Fallback to flower video
<video
    src={videoUrl || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}
    // ...
/>

// Line 952 - videoUrl starts empty
const [videoUrl, setVideoUrl] = useState("");

// Lines 958-968 - Only reads from initialVideo prop, NOT URL params
useEffect(() => {
    if (!initialVideo) return;  // ❌ Returns early if no prop
    if (initialVideo.videoUrl) setVideoUrl(initialVideo.videoUrl);
    // ...
}, [initialVideo]);
```

## Solution

### 1. Import useSearchParams (`src/Videoplayer.jsx` - Line 2)

Added React Router's `useSearchParams` hook:

```javascript
import { useSearchParams } from 'react-router-dom';
```

### 2. Use searchParams in Component (Line 428)

Added searchParams hook to `MobileVideoPlayer`:

```javascript
export default function MobileVideoPlayer({ discoverItems = null, initialVideo = null, onChevronDown = null } = {}) {
    const auth = useAuth();
    const [searchParams] = useSearchParams();  // ✅ Added
    // ...
}
```

### 3. Read URL Parameters (Lines 972-990)

Added new useEffect to read URL parameters when no `initialVideo` prop:

```javascript
// Read URL parameters and set video info if no initialVideo prop
useEffect(() => {
    if (initialVideo) return; // Skip if initialVideo prop is provided
    
    const src = searchParams.get('src');
    const title = searchParams.get('title');
    const channel = searchParams.get('channel');
    
    if (src) {
        setVideoUrl(src);
    }
    if (title) {
        setVideoTitle(title);
    }
    if (channel) {
        setCreatorName(channel);
    }
}, [searchParams, initialVideo]);
```

## Files Modified

✅ `src/Videoplayer.jsx` - Lines 2, 428, 972-990
   - Added `useSearchParams` import
   - Added `searchParams` hook usage
   - Added useEffect to read URL parameters

## How It Works Now

### Before Fix:
1. Home → Click video → Navigate to `/videoplayer?src=...`
2. MobileVideoPlayer ignores URL params
3. `videoUrl` stays `""`
4. Falls back to flower.mp4 ❌

### After Fix:
1. Home → Click video → Navigate to `/videoplayer?src=...`
2. MobileVideoPlayer reads URL params via `searchParams.get('src')`  
3. Sets `videoUrl` to the actual uploaded video URL
4. Video tag uses the correct source ✅

## Testing Steps

1. **Restart the frontend:**
   ```bash
   npm run dev
   ```

2. **Publish a video:**
   - Go to Creator Dashboard
   - Upload video and thumbnail
   - Click "Publish"

3. **Navigate to home page:**
   - Find your published video
   - Video card should show correct thumbnail

4. **Click to watch:**
   - Click on the video card
   - Should navigate to video player
   - **Should play YOUR uploaded video** (not the flower video)

5. **Verify URL:**
   - Check browser address bar
   - Should show: `/videoplayer?src=http://localhost:4000/uploads/intro-...mp4`

## Expected Results

### Before Fix:
- ❌ All videos showed generic flower video
- ❌ URL params were ignored
- ❌ Uploaded videos never played

### After Fix:
- ✅ Uploaded videos play correctly
- ✅ URL params are read and used
- ✅ Each video shows its own content
- ✅ Thumbnail and video content match

## Technical Details

### URL Parameters Used:
- `src` - Video file URL (uploaded to server)
- `title` - Video title
- `channel` - Creator/author name
- `subtitle` - Requester name (if from request)
- `id` - Video ID

### Priority Order:
1. **initialVideo prop** (if passed directly) - Takes precedence
2. **URL parameters** (if no prop) - NEW: Now works!
3. **Fallback video** (flower.mp4) - Only if neither above exists

## Related Components

- `home.jsx` - Generates navigation with URL params (line 2752)
- `MobileVideoPlayer` - Now reads those params (line 972-990)
- No changes needed to other components

## Impact

✅ Videos uploaded from Creator Dashboard now play correctly
✅ URL-based navigation works as expected  
✅ Video player properly displays uploaded content
✅ No more generic flower video for user uploads
