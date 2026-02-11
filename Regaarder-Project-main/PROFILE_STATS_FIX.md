# Profile Stats Showing Fake Data - FIXED

## Problem
When clicking on a creator or requester name from the home page, their profile dialog shows fake/hardcoded stats:
- 24 Videos (fake)
- 12 Requests (fake)
- 1.2k Followers (fake)

Instead of showing the actual number of videos they created or requested.

## Root Cause

The `ProfileDialog` component was using hardcoded placeholder data:

```javascript
// Lines 1728-1738 - OLD CODE
const data = profileData || {
    avatar: null,
    bio: isCreator ? 'Creating engaging content for you' : 'Enjoying great content',
    stats: {
        videos: isCreator ? 24 : 0,      // ❌ Hardcoded
        requests: 12,                     // ❌ Hardcoded
        followers: 1245,                  // ❌ Hardcoded
        following: 180                    // ❌ Hardcoded
    },
    verified: false,
    joinedDate: currentYear
};
```

When `handleOpenProfile` was called from `ContentCard` (lines 3091, 3101), it wasn't passing the `data` parameter, so the dialog always used the fake placeholder data.

## Solution

### 1. Pass Videos Array to ContentCard

**Updated ContentCard component signature (Line 2910):**
```javascript
const ContentCard = ({ 
    video, 
    onReportVideo, 
    onPinVideo, 
    onOpenProfile, 
    onToggleBookmark, 
    onUnpinVideo, 
    onOpenShare, 
    onNotInterested, 
    onVideoClick, 
    showRequestsTooltip = false, 
    markRequestsSeen = () => {}, 
    isFirstRequested = false, 
    allVideos = []  // ✅ Added
}) => {
```

**Pass videos when rendering ContentCard (Line 2738):**
```javascript
<ContentCard
    key={video.id}
    video={video}
    allVideos={videos}  // ✅ Added
    onReportVideo={handleReportVideo}
    // ...
/>
```

### 2. Calculate Real Stats for Creator (Lines 3091-3113)

```javascript
onClick={(e) => { 
    e.stopPropagation(); 
    if (onOpenProfile) {
        // ✅ Calculate real stats from actual video data
        const creatorVideos = allVideos.filter(v => 
            v.author === video.author || v.authorId === video.authorId
        );
        
        const creatorData = {
            avatar: null,
            bio: 'Creating engaging content for you',
            stats: {
                videos: creatorVideos.length,  // ✅ Real count
                requests: 0,                    // TODO: Would need requests data
                followers: 0                    // TODO: Would need followers data from backend
            },
            verified: false,
            joinedDate: new Date().getFullYear()
        };
        
        onOpenProfile(video.author, true, creatorData);
    }
}}
```

### 3. Calculate Real Stats for Requester (Lines 3117-3142)

```javascript
onClick={(e) => { 
    e.stopPropagation(); 
    if (onOpenProfile) {
        // ✅ Calculate real stats from actual video data
        const requesterVideos = allVideos.filter(v => 
            v.requester === video.requester
        );
        
        const requesterData = {
            avatar: null,
            bio: 'Enjoying great content',
            stats: {
                videos: 0,                      // Requesters don't create videos
                requests: requesterVideos.length, // ✅ Real count of videos they requested
                followers: 0                    // TODO: Would need followers data from backend
            },
            verified: false,
            joinedDate: new Date().getFullYear()
        };
        
        onOpenProfile(video.requester, false, requesterData);
    }
}}
```

## Files Modified

✅ `src/home.jsx` - Lines 2738, 2910, 3091-3113, 3117-3142
   - Added `allVideos` prop to ContentCard
   - Pass `videos` array when rendering ContentCard
   - Calculate real stats for creators (video count)
   - Calculate real stats for requesters (request count)

## How It Works Now

### For Creators:
1. User clicks creator name (e.g., "Joshuar")
2. Filter `allVideos` to find videos where `author` matches
3. Count = number of videos they created
4. Display actual count in profile dialog ✅

### For Requesters:
1. User clicks requester name (e.g., "js")
2. Filter `allVideos` to find videos where `requester` matches
3. Count = number of videos they requested
4. Display actual count in profile dialog ✅

## Testing Steps

1. **Restart frontend:**
   ```bash
   npm run dev
   ```

2. **Publish multiple videos:**
   - Publish 2-3 videos as the same creator
   - Or claim and fulfill some requests

3. **Go to home page:**
   - Find videos from the same creator

4. **Click creator name:**
   - Should show actual video count (e.g., "3 Videos")
   - Not the fake "24 Videos"

5. **Click requester name (if video has one):**
   - Should show actual request count
   - Not the fake "12 Requests"

## Expected Results

### Before Fix:
- ❌ **Creator:** Always shows "24 Videos, 12 Requests, 1.2k Followers"
- ❌ **Requester:** Always shows "0 Videos, 12 Requests, 1.2k Followers"
- ❌ Same fake data for everyone

### After Fix:
- ✅ **Creator:** Shows actual video count (e.g., "3 Videos")
- ✅ **Requester:** Shows actual request count (e.g., "2 Requests")
- ✅ Different counts for different users
- ⚠️ **Followers:** Still shows "0" (requires backend integration)

## Current Limitations

### Still Shows "0" for Followers
The followers count still shows "0" because it requires backend data:

```javascript
const creatorFollowers = 0; // TODO: Would need followers data from backend
```

**To fully implement:**
1. Backend needs a followers table/field in users.json
2. Frontend needs to fetch follower count via API
3. Update the stats calculation to use real follower data

### Example Future Implementation:
```javascript
// Fetch follower count from backend
const response = await fetch(`${BACKEND}/users/${video.authorId}/followers`);
const { followers } = await response.json();

const creatorData = {
    stats: {
        videos: creatorVideos.length,
        requests: 0,
        followers: followers  // ✅ Real followers from backend
    }
};
```

## Impact

✅ Profile dialogs now show real video/request counts
✅ Different users show different stats
✅ More accurate representation of user activity
✅ Foundation ready for adding real follower counts

⚠️ Followers still show "0" until backend integration

## Technical Details

### Filtering Logic

**For creators:**
```javascript
const creatorVideos = allVideos.filter(v => 
    v.author === video.author || v.authorId === video.authorId
);
```
Matches by either author name or authorId for reliability.

**For requesters:**
```javascript
const requesterVideos = allVideos.filter(v => 
    v.requester === video.requester
);
```
Matches by requester name.

### Data Structure

The `profileData` object passed to `ProfileDialog`:
```javascript
{
    avatar: null,              // User avatar URL
    bio: string,               // User bio text
    stats: {
        videos: number,         // ✅ Real count
        requests: number,       // ✅ Real count  
        followers: number       // ⚠️ Still 0
    },
    verified: boolean,          // Verification status
    joinedDate: number          // Year joined
}
```
