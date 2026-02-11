# Code Changes Reference

## 1. HOME.jsx - Ad Visibility Banner

### Location: Lines 3717-3745 (after TopHeader component)

### Code Added:
```jsx
{/* Ad Visibility Message Banner */}
{auth?.user && (
    (() => {
        // Check if user has a paid subscription
        const hasPaidPlan = auth.user.subscription && 
                           auth.user.subscription.tier && 
                           auth.user.subscription.tier !== 'free' && 
                           auth.user.subscription.tier !== 'Free' &&
                           auth.user.subscription.isActive !== false;
        
        const isPaidUser = hasPaidPlan;
        const messageKey = isPaidUser ? 'premium_no_ads' : 'free_tier_with_ads';
        const message = isPaidUser 
            ? getTranslation('You\'re on a premium plan — no ads will be shown', selectedLanguage)
            : getTranslation('Free tier account — ads will be shown', selectedLanguage);
        const bgColor = isPaidUser ? 'bg-green-50' : 'bg-blue-50';
        const borderColor = isPaidUser ? 'border-green-200' : 'border-blue-200';
        const textColor = isPaidUser ? 'text-green-800' : 'text-blue-800';
        const iconColor = isPaidUser ? 'text-green-600' : 'text-blue-600';
        
        return (
            <div className={`mx-4 mt-3 mb-3 px-4 py-3 rounded-lg border ${bgColor} ${borderColor}`}>
                <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
                        {isPaidUser ? (
                            <Icon name="check" size={18} />
                        ) : (
                            <Icon name="info" size={18} />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${textColor}`}>
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        );
    })()
)}
```

---

## 2. TRANSLATIONS.js - Ad Messages

### Location: After "Upgrade Your Plan" (Line 321)

### Code Added:
```javascript
// Ad Visibility Messages
'You\'re on a premium plan — no ads will be shown': 'You\'re on a premium plan — no ads will be shown',
'Free tier account — ads will be shown': 'Free tier account — ads will be shown',
```

---

## 3. BOOKMARKS.jsx - Header Refactor

### Imports Added (Line 1):
```javascript
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

### Hook Added (Line ~8-10):
```javascript
const navigate = useNavigate();
```

### Header JSX (Lines ~107-120):
**Before:**
```jsx
<div className="flex items-center justify-between sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-6">
    <div className="flex items-center space-x-2">
        <Icon name="bookmarks" size={24} className="text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-800">{t('Bookmarks')}</h1>
    </div>
    <button onClick={() => setShowMenu(!showMenu)}>
        <Icon name="more" size={20} className="text-gray-700" />
    </button>
</div>
```

**After:**
```jsx
<header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
    <div className="flex items-center space-x-4">
        <ChevronLeft 
            className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900" 
            onClick={() => navigate(-1)} 
        />
        <h1 className="text-xl font-semibold text-gray-800">{t('Bookmarks')}</h1>
    </div>
</header>
```

---

## 4. WATCHHISTORY.jsx - Header Refactor

### Imports Added (Line 1):
```javascript
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

### App Component Update (Line ~140):
```javascript
const navigate = useNavigate();
```

### Header JSX (Lines ~282-297):
**Before:**
```jsx
<div className="flex items-center justify-between sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-6">
    <div className="flex items-center">
        <Icon name="history" size={24} className="text-gray-700 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">{t('Watch History')}</h1>
    </div>
    <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-red-100 text-red-700 rounded">
        {t('Clear All')}
    </button>
</div>
```

**After:**
```jsx
<header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
    <div className="flex items-center space-x-4">
        <ChevronLeft 
            className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900" 
            onClick={() => navigate(-1)} 
        />
        <h1 className="text-xl font-semibold text-gray-800">{t('Watch History')}</h1>
    </div>
</header>

{/* Clear All Button */}
<div className="px-4 py-3 border-b border-gray-100 bg-white">
    <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-red-100 text-red-700 rounded">
        {t('Clear All')}
    </button>
</div>
```

---

## 5. LIKEDVIDEOS.jsx - Header Refactor

### Imports Added (Line 1):
```javascript
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

### Hook Added (Line ~70-75):
```javascript
const navigate = useNavigate();
const appNavigate = useAppNavigate(); // Keep for app-specific navigation
```

### Header JSX (Lines ~155-183):
**Before:**
```jsx
<div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-6">
    <h1 className="text-2xl font-bold text-gray-800">{t('Liked Videos')}</h1>
</div>
```

**After:**
```jsx
<header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
    <div className="flex items-center space-x-4">
        <ChevronLeft 
            className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900" 
            onClick={() => navigate(-1)} 
        />
        <h1 className="text-xl font-semibold text-gray-800">{t('Liked Videos')}</h1>
    </div>
</header>

{/* Clear All Button */}
{likedVideos.length > 0 && (
    <div className="px-4 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
        <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-red-100 text-red-700 rounded">
            {t('Clear All')}
        </button>
    </div>
)}
```

---

## 6. PLAYLISTS.jsx - Header Refactor

### Imports Added (Line 1):
```javascript
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

### Hooks Added (Line ~70-73):
```javascript
const navigate = useNavigate();
const appNavigate = useAppNavigate(); // For app navigation
```

### Header JSX (Lines ~136-150):
**Before:**
```jsx
<div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-6 flex items-center justify-between">
    <div className="flex items-center">
        <Icon name="listPlus" size={24} className="text-gray-700 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">{t('Playlists')}</h1>
    </div>
    <button onClick={() => setShowNewPlaylist(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
        {t('New')}
    </button>
</div>
```

**After:**
```jsx
<header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
    <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <ChevronLeft 
                className="w-6 h-6 text-gray-700 cursor-pointer transition hover:text-gray-900" 
                onClick={() => navigate(-1)} 
            />
            <h1 className="text-xl font-semibold text-gray-800">{t('Playlists')}</h1>
        </div>
        <button onClick={() => setShowNewPlaylist(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
            {t('New')}
        </button>
    </div>
</header>
```

---

## Summary of Changes

| Component | Type | Lines | Changes |
|-----------|------|-------|---------|
| home.jsx | Addition | 3717-3745 | Added ad visibility banner |
| translations.js | Addition | 321-323 | Added translation keys |
| bookmarks.jsx | Modification | 1, 8-10, 107-120 | Header refactor + imports |
| watchhistory.jsx | Modification | 1, 140, 282-297 | Header refactor + imports |
| likedvideos.jsx | Modification | 1, 70-75, 155-183 | Header refactor + imports |
| playlists.jsx | Modification | 1, 70-73, 136-150 | Header refactor + imports |

**Total Files Modified:** 6
**Build Status:** ✅ Successful
