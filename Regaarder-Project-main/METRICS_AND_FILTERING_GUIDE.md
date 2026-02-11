# Comprehensive User Metrics & Filtering System

## Overview
The new metrics system provides detailed user activity data for staff to make informed targeting decisions during promotions. It enables sophisticated filtering based on engagement, subscription status, and request history.

## Backend Changes

### New Endpoint: `/staff/user-metrics`
**Route:** `GET /staff/user-metrics?employeeId={id}`

**Purpose:** Calculate and return comprehensive activity metrics for all users

**Response Format:**
```json
{
  "metrics": [
    {
      "id": "user-1766857658728",
      "name": "Joshuar",
      "email": "jshsajous@gmail.com",
      "isCreator": true,
      "createdRequestsCount": 5,
      "fulfilledRequestsCount": 3,
      "freeRequestsCount": 2,
      "totalRequestsEngagement": 8,
      "hasPlan": true,
      "subscriptionPlan": "pro",
      "daysSinceCreation": 24,
      "daysSinceLastActivity": 2,
      "videosCreated": 7,
      "profileViews": 156,
      "streak": 6,
      "warnings": 1,
      "isShadowBanned": false
    }
  ]
}
```

## Metrics Explained

### Request Engagement
- **createdRequestsCount**: Number of requests posted by the user
- **fulfilledRequestsCount**: Number of requests completed by the user (only counted when currentStep === 6)
- **freeRequestsCount**: Number of free requests (amount = 0) created by the user
- **totalRequestsEngagement**: Combined count of created + fulfilled requests

### Subscription Status
- **hasPlan**: Boolean indicating if user has an active paid plan (subscriptionPlan !== 'none' and !== 'free')
- **subscriptionPlan**: Current subscription level (e.g., 'free', 'starter', 'pro', 'creator', 'brand')

### Activity & Engagement
- **daysSinceCreation**: Days since account was created
- **daysSinceLastActivity**: Days since last meaningful activity (last warning, streak reset, etc.)
- **videosCreated**: Number of videos uploaded by the user
- **profileViews**: Estimated profile view count
- **streak**: Current daily login streak

### Account Status
- **warnings**: Total number of warnings issued
- **isShadowBanned**: Boolean indicating shadowban status

## Frontend Implementation

### State Management
New filter states added to `StaffDashboard.jsx`:
```javascript
const [planFilter, setPlanFilter] = useState('all');
const [requestActivityFilter, setRequestActivityFilter] = useState('all');
const [daysActiveFilter, setDaysActiveFilter] = useState('');
const [userMetrics, setUserMetrics] = useState({});
```

### Data Loading
Metrics are fetched on dashboard load:
```javascript
const metricsRes = await fetch(`http://localhost:4000/staff/user-metrics?employeeId=${employee.id}`);
if (metricsRes.ok) {
  const data = await metricsRes.json();
  const metricsMap = {};
  (data.metrics || []).forEach(m => {
    metricsMap[m.id] = m;
  });
  setUserMetrics(metricsMap);
}
```

## Promotion Filtering Options

### Available Filters

#### 1. **Subscription Plan**
- **All Plans**: No filter applied
- **Has Plan**: Only users with active paid subscription
- **No Plan**: Only users with free or no subscription

#### 2. **Request Activity**
- **All Activity**: No filter applied
- **Created Requests**: Only users who have created requests
- **Fulfilled Requests**: Only users who have completed/fulfilled requests
- **Made Free Requests**: Only users who created free requests
- **No Request Activity**: Only users with zero request engagement

#### 3. **Days Active (Maximum)**
- Input field to filter users who were active within X days
- Example: "7" shows only users active in the last 7 days
- Uses `daysSinceLastActivity` metric

#### 4. **Existing Filters (Enhanced)**
- **Creators Only**: Toggle to show only creator accounts
- **Category**: Filter by creator category
- **Min Requests**: Minimum number of requests (legacy filter)
- **Min $/request**: Minimum average price per request

### Filter UI Layout
The filters are displayed in a responsive grid layout that adapts to screen size:
```
[Creators Only] [Category ▼] [Subscription ▼]
[Request Activity ▼] [Min Requests □] [Min $/request □]
[Days Active □] [Reset Filters]
```

## User Card Display

### Activity Badges
When viewing users in the promotion modal, each user card now displays activity badges:

```
John Doe
john@example.com
💳 Has Plan  📋 5 Created  ✅ 3 Fulfilled  🎁 1 Free  🔥 Active
```

### Badge Types & Colors
| Badge | Condition | Background | Text Color |
|-------|-----------|-----------|-----------|
| 💳 Has Plan | User has active paid plan | Light Blue (#dbeafe) | Dark Blue (#0369a1) |
| 📋 N Created | User created N requests | Light Yellow (#fef3c7) | Dark Yellow (#92400e) |
| ✅ N Fulfilled | User fulfilled N requests | Light Green (#dcfce7) | Dark Green (#166534) |
| 🎁 N Free | User made N free requests | Light Pink (#fce7f3) | Dark Pink (#831843) |
| 🔥 Active | Last activity ≤ 7 days ago | Gray (#d1d5db) | Dark Gray (#111) |

## Use Cases

### 1. Target High-Value Creators
```
Filter: Creators Only + Has Plan + Days Active ≤ 7
Result: Recently active creators with paid subscriptions
```

### 2. Re-engage Inactive Users
```
Filter: No Plan + Days Active > 30
Result: Free users who haven't been active recently
```

### 3. Reward Fulfilled Requests
```
Filter: Fulfilled Requests + Days Active ≤ 14
Result: Active users who complete work frequently
```

### 4. Promote Free Features to Engaged Users
```
Filter: Made Free Requests + Days Active ≤ 7
Result: Active users interested in free opportunities
```

### 5. Upsell to Potential Customers
```
Filter: Created Requests + No Plan + Days Active ≤ 14
Result: Active, engaged users without subscriptions
```

## Technical Benefits

### Performance
- Metrics calculated server-side once on dashboard load
- Cached in frontend state as `userMetrics` object
- Filtering happens client-side for instant search results
- No additional API calls when filters change

### Data Accuracy
- Request counts from actual request.json data
- Plan status from user subscription fields
- Activity dates calculated from actual user data fields
- Real-time calculation prevents stale data

### Scalability
- Metrics endpoint handles large user bases
- Filtering logic is O(n) on frontend
- Metadata-first approach reduces data transfer
- Can be extended with additional metrics easily

## Future Enhancements

### Potential Metrics to Add
1. **Video Engagement**
   - Total video views
   - Average video completion rate
   - Most watched video category

2. **Spending Behavior**
   - Total amount spent on requests
   - Average request value
   - Monthly spending trend

3. **Community Engagement**
   - Comments posted
   - Ideas submitted
   - Bookmarks created
   - Videos favorited

4. **Content Quality**
   - Average video rating
   - Number of videos deleted/hidden
   - Report count

5. **Growth Metrics**
   - Followers gained this month
   - Video upload frequency
   - Request fulfillment rate

### Dashboard Visualization
Could add:
- Charts showing user segments
- Metrics timeline showing trends
- User cohort analysis
- Promotion ROI tracking per segment

## Testing Checklist

- [ ] Load Staff Dashboard and verify metrics endpoint is called
- [ ] Check that metrics data populates correctly for all users
- [ ] Test each filter individually
- [ ] Test filter combinations
- [ ] Verify Reset Filters button clears all selections
- [ ] Confirm activity badges display correctly
- [ ] Test promotion sending with filtered users
- [ ] Verify UI remains responsive with large user counts
- [ ] Check performance with 1000+ users

## Database Fields Used

The metrics system reads from these existing user fields:
- `id`, `name`, `email`, `isCreator`
- `subscriptionPlan`, `createdAt`
- `lastWarning`, `lastStreakDate`, `streak`
- `profileViews`, `shadowBanned`

And from requests data:
- `createdBy`, `claimedBy.id`, `currentStep`, `amount`

No new database fields were required - everything uses existing data.
