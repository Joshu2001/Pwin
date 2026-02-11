# Implementation Guide: Extending Metrics to Users & Creators Pages

## Overview
This guide explains how to add the same activity metrics and filtering capabilities to the Users and Creators management pages.

## Architecture Pattern

### Current Implementation (Promotion Modal)
```
1. Dashboard loads → fetch /staff/user-metrics
2. Metrics stored in state: userMetrics = { [userId]: metricData }
3. Filter UI allows staff to define criteria
4. JavaScript filter function applies criteria client-side
5. User list updates in real-time
6. Badges display activity data inline
```

### Same Pattern for Users/Creators Pages

## Components to Create/Modify

### 1. Users Management Page
**File Location**: Need to find/create users management component

**Add These Elements**:
- Metrics data display in table columns
- Advanced filter sidebar
- Activity badges on each row
- Metrics-based sorting options

**New Columns to Display**:
| Column | Source | Format |
|--------|--------|--------|
| Activity Level | daysSinceLastActivity | "Last seen X days ago" |
| Plan | hasPlan + subscriptionPlan | "Pro" / "Free" / "None" |
| Requests | totalRequestsEngagement | "8 (5 created, 3 fulfilled)" |
| Videos | videosCreated | Number badge |
| Profile Views | profileViews | Number badge |
| Status | isShadowBanned, warnings | Colored indicator |

### 2. Creators Management Page
**File Location**: Need to find/create creators management component

**Add These Elements**:
- Creator-specific metrics (video quality, earnings, etc.)
- Filter by subscription tier
- Filter by video count
- Filter by engagement rate
- Creator performance indicators

**New Metrics for Creators**:
- Total video views (sum of all videos' views)
- Average video rating
- Content upload frequency (videos/month)
- Follower growth trend
- Average earnings per request
- Creator reputation score

### 3. Shared Utility Functions

Create `src/utils/metricsHelper.js`:

```javascript
// Format activity text
export const formatLastActivity = (daysSinceLastActivity) => {
  if (daysSinceLastActivity === 0) return '🔥 Today';
  if (daysSinceLastActivity === 1) return '🔥 Yesterday';
  if (daysSinceLastActivity <= 7) return `🔥 ${daysSinceLastActivity}d ago`;
  if (daysSinceLastActivity <= 30) return `${Math.ceil(daysSinceLastActivity / 7)}w ago`;
  return `${Math.ceil(daysSinceLastActivity / 30)}m ago`;
};

// Get activity level badge
export const getActivityBadge = (daysSinceLastActivity) => {
  if (daysSinceLastActivity <= 1) return { text: 'Hot', color: '#ef4444' };
  if (daysSinceLastActivity <= 7) return { text: 'Active', color: '#f59e0b' };
  if (daysSinceLastActivity <= 30) return { text: 'Moderate', color: '#3b82f6' };
  return { text: 'Inactive', color: '#9ca3af' };
};

// Filter users by multiple criteria
export const filterByCriteria = (users, metrics, filters) => {
  return users.filter(user => {
    const m = metrics[user.id];
    if (!m) return false;
    
    if (filters.planFilter !== 'all') {
      const hasPlan = m.hasPlan;
      if (filters.planFilter === 'hasplan' && !hasPlan) return false;
      if (filters.planFilter === 'noplan' && hasPlan) return false;
    }
    
    if (filters.minDaysSinceLast && m.daysSinceLastActivity > filters.minDaysSinceLast) {
      return false;
    }
    
    if (filters.minVideos && m.videosCreated < filters.minVideos) return false;
    if (filters.minRequests && m.totalRequestsEngagement < filters.minRequests) return false;
    
    return true;
  });
};
```

## Users Page - Detailed Implementation

### Data Structure
```jsx
const [usersWithMetrics, setUsersWithMetrics] = useState([]);
const [userFilter, setUserFilter] = useState({
  planStatus: 'all', // all, paid, free
  activityLevel: 'all', // all, active, moderate, inactive
  minDaysSinceCreation: '',
  minVideos: '',
  minRequests: '',
  status: 'all', // all, active, shadowbanned, warned
  searchTerm: ''
});
```

### Table View
```jsx
<div className="users-table">
  <table>
    <thead>
      <tr>
        <th onClick={() => sortBy('name')}>Name</th>
        <th onClick={() => sortBy('email')}>Email</th>
        <th onClick={() => sortBy('plan')}>Plan</th>
        <th onClick={() => sortBy('activity')}>Activity</th>
        <th onClick={() => sortBy('engagement')}>Engagement</th>
        <th onClick={() => sortBy('status')}>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredUsers.map(user => (
        <tr key={user.id} className={user.shadowBanned ? 'shadowbanned' : ''}>
          <td>{user.name}</td>
          <td>{user.email}</td>
          <td>
            {metrics[user.id]?.hasPlan ? (
              <span className="badge-plan">{metrics[user.id].subscriptionPlan}</span>
            ) : (
              <span className="badge-free">Free</span>
            )}
          </td>
          <td>
            {formatLastActivity(metrics[user.id]?.daysSinceLastActivity)}
          </td>
          <td>
            📋 {metrics[user.id]?.createdRequestsCount} |
            ✅ {metrics[user.id]?.fulfilledRequestsCount} |
            🎬 {metrics[user.id]?.videosCreated}
          </td>
          <td>
            {user.shadowBanned ? <span>⚠️ Banned</span> : <span>✓ Active</span>}
          </td>
          <td>
            <button onClick={() => viewUser(user.id)}>View</button>
            <button onClick={() => editUser(user.id)}>Edit</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Filter Sidebar
```jsx
<div className="filter-sidebar">
  <h3>Filters</h3>
  
  <div className="filter-group">
    <label>Plan Status</label>
    <select value={userFilter.planStatus} onChange={(e) => setUserFilter({...userFilter, planStatus: e.target.value})}>
      <option value="all">All</option>
      <option value="paid">Paid Plans</option>
      <option value="free">Free</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Activity Level</label>
    <select value={userFilter.activityLevel} onChange={(e) => setUserFilter({...userFilter, activityLevel: e.target.value})}>
      <option value="all">All</option>
      <option value="active">Active (< 7 days)</option>
      <option value="moderate">Moderate (7-30 days)</option>
      <option value="inactive">Inactive (> 30 days)</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Account Status</label>
    <select value={userFilter.status} onChange={(e) => setUserFilter({...userFilter, status: e.target.value})}>
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="shadowbanned">Shadowbanned</option>
      <option value="warned">Warned</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Min Videos</label>
    <input type="number" min="0" placeholder="0" value={userFilter.minVideos} onChange={(e) => setUserFilter({...userFilter, minVideos: e.target.value})} />
  </div>

  <div className="filter-group">
    <label>Min Requests</label>
    <input type="number" min="0" placeholder="0" value={userFilter.minRequests} onChange={(e) => setUserFilter({...userFilter, minRequests: e.target.value})} />
  </div>

  <button onClick={() => resetUserFilters()}>Reset Filters</button>
</div>
```

## Creators Page - Detailed Implementation

### Creator-Specific Metrics
```javascript
// Add to /staff/user-metrics endpoint for creators
{
  ...baseMetrics,
  // Creator-specific
  averageVideoRating: 4.5,
  totalVideoViews: 12450,
  monthlyUploadFrequency: 4, // videos per month
  followerCount: 523,
  followerGrowthRate: 0.15, // 15% per month
  avgEarningsPerRequest: 125.50,
  creatorReputation: 0.87, // 0-1 score based on ratings + engagement
  mostPopularCategory: 'tutorials'
}
```

### Creator Card Component
```jsx
const CreatorCard = ({ creator, metrics }) => (
  <div className="creator-card">
    <div className="creator-header">
      <img src={creator.image} alt={creator.name} className="creator-image" />
      <div>
        <h3>{creator.name}</h3>
        <p className="tagline">{creator.tagline}</p>
      </div>
    </div>

    <div className="creator-stats">
      <div className="stat">
        <span className="label">Videos</span>
        <span className="value">{metrics.videosCreated}</span>
      </div>
      <div className="stat">
        <span className="label">Views</span>
        <span className="value">{metrics.totalVideoViews?.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="label">Rating</span>
        <span className="value">⭐ {metrics.averageVideoRating?.toFixed(1)}</span>
      </div>
      <div className="stat">
        <span className="label">Followers</span>
        <span className="value">{metrics.followerCount}</span>
      </div>
    </div>

    <div className="creator-badges">
      {metrics.hasPlan && <span className="badge-plan">💳 {metrics.subscriptionPlan}</span>}
      {metrics.avgEarningsPerRequest > 100 && <span className="badge-high-value">💰 Premium</span>}
      {metrics.averageVideoRating > 4 && <span className="badge-quality">⭐ Quality Creator</span>}
      {metrics.followerGrowthRate > 0.2 && <span className="badge-growth">📈 Growing</span>}
    </div>

    <button className="btn-primary">Send Promotion</button>
    <button className="btn-secondary">View Profile</button>
  </div>
);
```

### Creator Filter UI
```jsx
<div className="filter-sidebar">
  <h3>Creator Filters</h3>
  
  <div className="filter-group">
    <label>Quality Tier</label>
    <select>
      <option value="all">All Creators</option>
      <option value="premium">Premium (Rating > 4.5)</option>
      <option value="quality">Quality (Rating > 4.0)</option>
      <option value="developing">Developing (< 4.0 ratings)</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Growth Status</label>
    <select>
      <option value="all">All</option>
      <option value="growing">Growing (+15% followers/mo)</option>
      <option value="established">Established (5%+ followers/mo)</option>
      <option value="stagnant">Stagnant (< 5% followers/mo)</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Subscription Tier</label>
    <select>
      <option value="all">All Tiers</option>
      <option value="premium">Premium Only</option>
      <option value="free">Free Only</option>
    </select>
  </div>

  <div className="filter-group">
    <label>Min Views</label>
    <input type="number" min="0" placeholder="0" />
  </div>

  <div className="filter-group">
    <label>Min Rating</label>
    <input type="number" min="0" max="5" step="0.5" placeholder="3.0" />
  </div>
</div>
```

## API Updates Required

### Enhancement 1: Separate Creator Metrics
```javascript
// New endpoint: GET /staff/creator-metrics
app.get('/staff/creator-metrics', (req, res) => {
  try {
    const users = readUsers();
    const videos = readVideos();
    const requests = readRequests();

    const creatorMetrics = users
      .filter(u => u.isCreator)
      .map(creator => {
        const creatorVideos = videos.filter(v => v.creatorId === creator.id);
        const totalViews = creatorVideos.reduce((sum, v) => sum + (v.views || 0), 0);
        const avgRating = creatorVideos.length > 0 
          ? creatorVideos.reduce((sum, v) => sum + (v.rating || 0), 0) / creatorVideos.length
          : 0;
        
        // Calculate follower growth (mock data - would need actual follower history)
        const followerGrowthRate = 0.1; // 10% default
        
        return {
          ...baseMetrics(creator),
          totalVideoViews: totalViews,
          averageVideoRating: avgRating,
          monthlyUploadFrequency: creatorVideos.length / (creator.daysSinceCreation / 30),
          followerCount: creator.followers?.length || 0,
          followerGrowthRate,
          avgEarningsPerRequest: creator.price ? parseInt(creator.price) : 0
        };
      });

    res.json({ metrics: creatorMetrics });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

## Database Schema Considerations

### User Table - Recommended Additions
```javascript
{
  // ... existing fields
  // Activity tracking
  "lastActivityDate": "2026-01-20T10:30:00Z",
  "activityHistory": [
    { "type": "login", "date": "2026-01-20T10:30:00Z" },
    { "type": "request_created", "date": "2026-01-19T14:20:00Z" }
  ],
  // Creator profile
  "creatorStats": {
    "totalVideoViews": 12450,
    "averageVideoRating": 4.5,
    "followerCount": 523,
    "followerHistory": [
      { "date": "2026-01-01", "count": 500 },
      { "date": "2026-01-20", "count": 523 }
    ]
  },
  // Profile engagement
  "profileViews": 245,
  "profileViewsHistory": {
    "2026-01-20": 12,
    "2026-01-19": 8
  }
}
```

## Performance Optimization

### For Large User Bases (10,000+ users)

1. **Server-side Filtering**
```javascript
// Instead of returning all metrics, support server-side filters
GET /staff/user-metrics?filter=active&plan=paid
// Returns only filtered results to reduce data transfer
```

2. **Pagination**
```javascript
GET /staff/user-metrics?page=1&limit=100
// Returns 100 metrics per page
```

3. **Caching**
```javascript
// Cache metrics for 5 minutes to reduce recalculation
const CACHE_DURATION = 5 * 60 * 1000;
let cachedMetrics = null;
let cacheTime = 0;
```

4. **Indexing**
- Add database index on `subscriptionPlan`
- Add index on `createdAt` for date filtering
- Add index on `isCreator` for creator-only queries

## Testing Checklist

- [ ] Metrics display correctly in Users table
- [ ] Filters work individually in Users page
- [ ] Filter combinations work correctly
- [ ] Creator cards display with rich metrics
- [ ] Creator filter dropdowns work
- [ ] Sorting by metrics works
- [ ] Search term filters users correctly
- [ ] Mobile view is responsive
- [ ] Performance acceptable with 1000+ users
- [ ] Export/bulk actions work with filtered results

## Future Enhancements

1. **Analytics Dashboard**
   - Metrics trending over time
   - Cohort analysis
   - Churn prediction

2. **Automated Recommendations**
   - "Top creators to contact for collaboration"
   - "Users at churn risk"
   - "High-value targets for premium features"

3. **Segment Management**
   - Save custom filter combinations
   - Create user segments for campaigns
   - A/B test different segments

4. **Integration with CRM**
   - Export filtered lists to external tools
   - Sync user segments with email marketing
   - Track promotion ROI per segment
