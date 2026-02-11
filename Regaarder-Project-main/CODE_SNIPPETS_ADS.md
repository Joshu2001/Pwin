# Code Snippets - Applying Ads from StaffDashboard

This document contains ready-to-use code snippets for integrating the new ad system into StaffDashboard's apply buttons.

## 1. Video Ad - Apply Function

Use this function in StaffDashboard when user clicks "Apply" on a Video Ad:

```javascript
const handleApplyVideoAd = async () => {
  // Validate inputs
  if (!videoAdTitle || !videoAdCtaText) {
    setToast({ 
      type: 'error', 
      title: 'Missing Fields', 
      message: 'Please provide title and button text.' 
    });
    return;
  }

  // Get selected videos
  const selectedVideos = selectedVideosForVideoAd || [];
  if (selectedVideos.length === 0) {
    setToast({ 
      type: 'error', 
      title: 'No Videos Selected', 
      message: 'Please select at least one video.' 
    });
    return;
  }

  try {
    // Build video ad object
    const videoAd = {
      id: `video-ad-${Date.now()}`,
      type: 'video',  // IMPORTANT: Type field
      videoAdTitle: videoAdTitle,
      videoAdCtaText: videoAdCtaText,
      videoAdCtaColor: videoAdCtaColor || '#0b74de',
      videoAdLink: videoAdLink,
      startTime: 0,  // Start at beginning (customize as needed)
      duration: 30   // Show for 30 seconds (customize as needed)
    };

    // Send to backend
    const response = await fetch('http://localhost:4000/staff/apply-video-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoIds: selectedVideos,
        ad: videoAd
      })
    });

    if (response.ok) {
      setToast({
        type: 'success',
        title: 'Applied Successfully',
        message: `Video ad applied to ${selectedVideos.length} video(s)`
      });

      // Reset form
      setVideoAdTitle('');
      setVideoAdCtaText('');
      setVideoAdCtaColor('#0b74de');
      setVideoAdLink('');
      setAdsMode(null);
    } else {
      throw new Error('Failed to apply video ad');
    }
  } catch (error) {
    setToast({
      type: 'error',
      title: 'Error',
      message: error.message
    });
  }
};
```

## 2. Default 2 Ad - Apply Function

Use this function when user clicks "Apply" on a Default 2 Ad:

```javascript
const handleApplyDefault2Ad = async () => {
  // Validate inputs
  if (!default2Title || !default2Description) {
    setToast({
      type: 'error',
      title: 'Missing Fields',
      message: 'Please provide title and description.'
    });
    return;
  }

  // Get selected videos
  const selectedVideos = selectedVideosForDefault2 || [];
  if (selectedVideos.length === 0) {
    setToast({
      type: 'error',
      title: 'No Videos Selected',
      message: 'Please select at least one video.'
    });
    return;
  }

  try {
    // Build default2 ad object
    const default2Ad = {
      id: `default2-ad-${Date.now()}`,
      type: 'default2',  // IMPORTANT: Type field
      default2Title: default2Title,
      default2Description: default2Description,
      default2Logo: default2Logo || '',  // Optional logo
      default2BgColor: default2BgColor || '#ffffff',
      default2TextColor: default2TextColor || '#111827',
      default2LineColor: default2LineColor || '#d946ef',
      default2Link: default2Link,
      startTime: 0,  // Start at beginning (customize as needed)
      duration: 30   // Show for 30 seconds (customize as needed)
    };

    // Send to backend
    const response = await fetch('http://localhost:4000/staff/apply-default2-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoIds: selectedVideos,
        ad: default2Ad
      })
    });

    if (response.ok) {
      setToast({
        type: 'success',
        title: 'Applied Successfully',
        message: `Default 2 ad applied to ${selectedVideos.length} video(s)`
      });

      // Reset form
      setDefault2Title('');
      setDefault2Description('');
      setDefault2Logo('');
      setDefault2BgColor('#ffffff');
      setDefault2TextColor('#111827');
      setDefault2LineColor('#d946ef');
      setDefault2Link('');
      setAdsMode(null);
    } else {
      throw new Error('Failed to apply default2 ad');
    }
  } catch (error) {
    setToast({
      type: 'error',
      title: 'Error',
      message: error.message
    });
  }
};
```

## 3. Overlay Ad - Apply Function

Use this function when user clicks "Apply" on an Overlay Ad:

```javascript
const handleApplyOverlayAd = async () => {
  // Validate inputs
  if (!overlayAdCompanyName) {
    setToast({
      type: 'error',
      title: 'Missing Fields',
      message: 'Please provide company name.'
    });
    return;
  }

  if (overlayAdTextItems.length === 0) {
    setToast({
      type: 'error',
      title: 'No Messages',
      message: 'Please add at least one message.'
    });
    return;
  }

  // Get selected videos
  const selectedVideos = selectedVideosForOverlay || [];
  if (selectedVideos.length === 0) {
    setToast({
      type: 'error',
      title: 'No Videos Selected',
      message: 'Please select at least one video.'
    });
    return;
  }

  try {
    // Build overlay ad object
    const overlayAd = {
      id: `overlay-ad-${Date.now()}`,
      type: 'overlay',  // IMPORTANT: Type field
      overlayAdCompanyName: overlayAdCompanyName,
      overlayAdEmoji: overlayAdEmoji || '⚡',
      overlayAdBgColor: overlayAdBgColor || '#E41E24',
      overlayAdTextColor: overlayAdTextColor || '#fff',
      overlayBrandBgColor: overlayBrandBgColor || overlayAdBgColor,
      overlayBrandTextColor: overlayBrandTextColor || overlayAdTextColor,
      overlayAdPosition: overlayAdPosition || 'bottom',
      overlayTextAnimation: overlayTextAnimation || 'marquee',
      overlayAdOpacity: overlayAdOpacity || 1,
      overlayTagOpacity: overlayTagOpacity || 1,
      overlayAdTextItems: overlayAdTextItems,  // Array of {text, duration}
      link: overlayAdLink || '',
      startTime: 0,  // Start at beginning (customize as needed)
      duration: overlayAdTextItems.reduce((sum, item) => sum + (item.duration || 5), 0)
    };

    // Send to backend
    const response = await fetch('http://localhost:4000/staff/apply-overlay-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoIds: selectedVideos,
        ad: overlayAd
      })
    });

    if (response.ok) {
      setToast({
        type: 'success',
        title: 'Applied Successfully',
        message: `Overlay ad applied to ${selectedVideos.length} video(s)`
      });

      // Reset form
      setOverlayAdCompanyName('');
      setOverlayAdEmoji('⚡');
      setOverlayAdTextItems([]);
      setOverlayAdBgColor('#E41E24');
      setOverlayAdTextColor('#fff');
      setOverlayAdPosition('bottom');
      setOverlayTextAnimation('marquee');
      setAdsMode(null);
    } else {
      throw new Error('Failed to apply overlay ad');
    }
  } catch (error) {
    setToast({
      type: 'error',
      title: 'Error',
      message: error.message
    });
  }
};
```

## 4. Bottom Ad - Apply Function

Use this function when user clicks "Apply" on a Bottom Ad:

```javascript
const handleApplyBottomAd = async () => {
  // Validate inputs
  if (!bottomAdProfileName || !bottomAdText) {
    setToast({
      type: 'error',
      title: 'Missing Fields',
      message: 'Please provide profile name and ad text.'
    });
    return;
  }

  // Get selected videos
  const selectedVideos = selectedVideosForBottom || [];
  if (selectedVideos.length === 0) {
    setToast({
      type: 'error',
      title: 'No Videos Selected',
      message: 'Please select at least one video.'
    });
    return;
  }

  try {
    // Build bottom ad object
    const bottomAd = {
      id: `bottom-ad-${Date.now()}`,
      type: 'bottom',  // IMPORTANT: Type field
      profileName: bottomAdProfileName,
      profileAvatar: bottomAdProfileAvatar || '',
      text: bottomAdText,
      link: bottomAdLink || '',
      startTime: 0,  // Start at beginning
      duration: 99999  // Show for entire video
    };

    // Send to backend
    const response = await fetch('http://localhost:4000/staff/apply-bottom-ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoIds: selectedVideos,
        ad: bottomAd
      })
    });

    if (response.ok) {
      setToast({
        type: 'success',
        title: 'Applied Successfully',
        message: `Bottom ad applied to ${selectedVideos.length} video(s)`
      });

      // Reset form
      setBottomAdProfileName('');
      setBottomAdProfileAvatar('');
      setBottomAdText('');
      setBottomAdLink('');
      setAdsMode(null);
    } else {
      throw new Error('Failed to apply bottom ad');
    }
  } catch (error) {
    setToast({
      type: 'error',
      title: 'Error',
      message: error.message
    });
  }
};
```

## 5. Backend Endpoint Template

Use these endpoint handlers in your backend (Express.js):

```javascript
// Save video ad to database
app.post('/staff/apply-video-ad', async (req, res) => {
  const { videoIds, ad } = req.body;
  
  try {
    // For each selected video, save the ad
    for (const videoId of videoIds) {
      // Get existing ads or create new array
      const video = await db.getVideo(videoId);
      const ads = video.ads || [];
      
      // Add new ad with type field
      ads.push({
        ...ad,
        id: ad.id,
        type: 'video',  // Ensure type is set
        appliedAt: new Date().toISOString()
      });
      
      // Save to database
      await db.updateVideo(videoId, { ads });
    }
    
    res.json({ success: true, message: 'Video ads applied' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save default2 ad to database
app.post('/staff/apply-default2-ad', async (req, res) => {
  const { videoIds, ad } = req.body;
  
  try {
    for (const videoId of videoIds) {
      const video = await db.getVideo(videoId);
      const ads = video.ads || [];
      
      ads.push({
        ...ad,
        id: ad.id,
        type: 'default2',  // Ensure type is set
        appliedAt: new Date().toISOString()
      });
      
      await db.updateVideo(videoId, { ads });
    }
    
    res.json({ success: true, message: 'Default 2 ads applied' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save overlay ad to database
app.post('/staff/apply-overlay-ad', async (req, res) => {
  const { videoIds, ad } = req.body;
  
  try {
    for (const videoId of videoIds) {
      const video = await db.getVideo(videoId);
      const ads = video.ads || [];
      
      ads.push({
        ...ad,
        id: ad.id,
        type: 'overlay',  // Ensure type is set
        appliedAt: new Date().toISOString()
      });
      
      await db.updateVideo(videoId, { ads });
    }
    
    res.json({ success: true, message: 'Overlay ads applied' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ads for a video
app.get('/video/:videoId/ads', async (req, res) => {
  try {
    const video = await db.getVideo(req.params.videoId);
    const ads = video.ads || [];
    
    // Filter ads based on current playback time in Videoplayer
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 6. Loading Ads in Videoplayer

Use this code in Videoplayer to fetch and load ads:

```javascript
// Load ads from backend when video loads
useEffect(() => {
  const loadAds = async () => {
    if (!videoInfo || !videoInfo.id) return;
    
    try {
      const response = await fetch(`http://localhost:4000/video/${videoInfo.id}/ads`);
      const data = await response.json();
      
      if (data.ads && Array.isArray(data.ads)) {
        // Merge with test ads
        const allAds = [...defaultTestAds, ...data.ads];
        setVideoAds(allAds);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      // Fall back to test ads
    }
  };
  
  loadAds();
}, [videoInfo?.id]);

// Update visible ads based on current time
useEffect(() => {
  if (!videoAds || !videoAds.length) return;
  
  const currentTimeSeconds = (currentTime || 0) * (duration || 1);
  
  const visible = videoAds.filter((ad) => {
    const hasStarted = currentTimeSeconds >= ad.startTime;
    const hasNotEnded = currentTimeSeconds < (ad.startTime + ad.duration);
    return hasStarted && hasNotEnded;
  });
  
  setVisibleAds(visible);
}, [currentTime, duration, videoAds]);
```

## 7. Common Customization Patterns

### Create a video ad with custom colors
```javascript
const myVideoAd = {
  id: 'my-video-ad-1',
  type: 'video',
  videoAdTitle: 'Exclusive Launch Offer',
  videoAdCtaText: 'Shop Now',
  videoAdCtaColor: '#ff6b35',  // Orange
  videoAdLink: 'https://example.com/shop',
  startTime: 10,
  duration: 15
};
```

### Create a branded default2 ad
```javascript
const myDefault2Ad = {
  id: 'my-default2-ad-1',
  type: 'default2',
  default2Title: 'Premium Subscription',
  default2Description: 'Unlock all features today',
  default2Logo: 'https://example.com/logo.png',
  default2BgColor: '#e3f2fd',
  default2TextColor: '#0d47a1',
  default2LineColor: '#2196f3',
  default2Link: 'https://example.com/subscribe',
  startTime: 20,
  duration: 20
};
```

### Create a news ticker overlay
```javascript
const myOverlayAd = {
  id: 'my-overlay-ad-1',
  type: 'overlay',
  overlayAdCompanyName: 'URGENT UPDATE',
  overlayAdEmoji: '🔥',
  overlayAdBgColor: '#ef4444',
  overlayAdTextColor: '#ffffff',
  overlayAdPosition: 'bottom',
  overlayTextAnimation: 'marquee',
  overlayAdTextItems: [
    { text: '🎉 NEW FEATURES LAUNCHED!', duration: 5 },
    { text: '⚡ 50% OFF EVERYTHING', duration: 5 },
    { text: '📱 DOWNLOAD APP NOW', duration: 5 }
  ],
  link: 'https://example.com',
  startTime: 0,
  duration: 30
};
```

---

**Ready to Use** ✅ - Copy and paste these functions into StaffDashboard
