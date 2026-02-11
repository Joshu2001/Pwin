# User Requests Display Fix

## Problem
When users create requests, they were not appearing in the "Your Requests" section of their profile page.

## Root Cause
1. The POST `/requests` endpoint didn't require authentication, so requests weren't properly associated with users
2. No endpoint existed to fetch user-specific requests
3. The userprofile.jsx page wasn't fetching or displaying user-created requests
4. The Ideas page wasn't sending the authorization token when creating requests

## Changes Made

### Backend (server.js)

1. **Modified POST `/requests` endpoint** (line ~458)
   - Added `authMiddleware` to require authentication
   - Now automatically associates requests with the logged-in user via `req.user.id`
   - Stores `createdBy` field on each request
   - Includes creator information (id, name, email) in the request object

2. **Added GET `/requests/my` endpoint** (new)
   - Returns only requests created by the logged-in user
   - Requires authentication via `authMiddleware`
   - Filters all requests by `createdBy === req.user.id`

### Frontend

#### ideas.jsx
- Updated request creation to include Authorization token
- Now sends `Bearer <token>` in the Authorization header when creating requests
- This ensures the backend can identify and associate the request with the user

#### userprofile.jsx

1. **Added useEffect to fetch user requests** (~line 430)
   - Fetches user's requests from `/requests/my` endpoint on mount
   - Uses stored authentication token
   - Updates the `requests` state with fetched data

2. **Added event listener for new requests** (~line 448)
   - Listens for `ideas:request_created` custom events
   - Automatically adds new requests to the profile without refresh
   - Ensures real-time updates when user creates a request

3. **Fixed RequestCard component** (~line 127)
   - Updated to handle various time formats (time, timeAgo, createdAt)
   - Fixed statusStyle bug (was undefined)
   - Added support for both string and object creator data
   - Improved image handling with fallback placeholder

## Testing

To verify the fix:
1. Log in as a user
2. Navigate to Ideas page
3. Create a new request
4. Navigate to Profile page
5. Check the "Your Requests" section - the new request should appear
6. Create another request and verify it appears without page refresh

## Migration Notes

Existing requests in the database won't have a `createdBy` field and won't show up in any user's profile. To fix this:
- Either manually update existing requests in `requests.json` to add `createdBy` field
- Or run a migration script to associate existing requests with users
- Or simply accept that old requests won't appear in profiles (clean slate)
