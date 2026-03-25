# Notification Clear-All and Profile Image Reliability Report

Date: 2026-03-26

## What was done

1. Fixed Clear All notifications behavior to avoid platform-wide impact.
2. Added frontend compatibility fallback when bulk notifications endpoint is unavailable (404/405).
3. Added resilient image URL handling for failing media URLs (including SSL protocol failures).
4. Updated creator selection/profile-image flow to prioritize real profile image fields over generic image sources.

## What was the problem

### 1) Notification clear-all outage behavior
- Clear All was previously sending many delete requests in parallel.
- Under load, that pattern could exhaust backend DB connection capacity and temporarily affect unrelated app data fetches.
- After moving frontend to a bulk endpoint, production logs showed `DELETE /notifications` returning `404`, meaning that route was unavailable on the running backend revision at that time.

### 2) SSL-failing image URLs
- Some uploaded image URLs failed with `ERR_SSL_PROTOCOL_ERROR`.
- Failed URLs could continue getting retried in render paths, causing repeated broken image UI and noisy console errors.

### 3) Wrong profile image source
- Some creator/user flows were carrying a generic `image` field from mixed sources.
- In specific paths, stale/non-profile image values could be used instead of canonical profile-avatar fields.

## Why it happened

- Batch delete pattern used request fan-out (`N` calls), which is fragile under constrained pools.
- Frontend moved ahead to bulk-delete API while production backend route availability lagged.
- Image handling accepted broad URL inputs and had no memory of known-failing media URLs.
- Creator payloads in some navigation paths did not consistently prioritize profile-specific image fields (`profilePicture`, `photoURL`, `avatar`).

## How it was solved

### A) Notifications clear-all hardening
- Added/used single-call bulk clear path when available.
- Added frontend fallback: when bulk clear returns 404/405 (or request fails), clear notifications sequentially via `DELETE /notifications/:id` instead of parallel fan-out.
- Sequential fallback avoids connection-pool saturation while preserving functionality.

### B) Media URL fallback handling
- Added failed-media cache in `src/utils/media.js`.
- New helpers:
  - `markMediaUrlAsFailed(url)`
  - `isMediaUrlMarkedFailed(url)`
- `resolveMediaUrl` now skips URLs already marked as failed, preventing repeated retries of known-bad SSL media URLs.
- Relevant image `onError` handlers now mark failed URLs before showing UI fallback.

### C) Profile image source correctness
- Added profile image selection priority in Ideas flow:
  - `profilePicture` -> `photoURL` -> `avatar` -> `image`
- Removed video-derived image fallback in creators extraction path (video fallback no longer seeds creator image from video metadata).
- Updated creator payload persistence across Home/Requests/Creator Profile paths to carry canonical profile-avatar fields consistently.
- Updated profile dialogs to resolve avatar from profile-specific fields first.

## Files updated

- `src/utils/media.js`
- `src/ideas.jsx`
- `src/home.jsx`
- `src/requests.jsx`
- `src/creatorprofile.jsx`

## Validation

- Type/diagnostic checks on modified files: no errors reported.
- Frontend production build completed successfully (`npm run build`).

## Expected result after deploy

- Clear All notifications works even if bulk endpoint is missing during rollout.
- Known SSL-broken media URLs stop repeatedly breaking the same UI elements.
- Creator/user profile avatars should prefer real profile images, not stale generic image values.

## Notes

- Browser network logs can still show one initial failed request for a previously unseen bad URL.
- After that first failure, the failed URL is cached client-side and should no longer be repeatedly retried in normal rendering paths.
