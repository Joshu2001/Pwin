# Quick Reference: Metrics & Filtering Feature

## Quick Start Guide

### Accessing the Feature
1. Go to Staff Dashboard
2. Click "Send New Promotion"
3. Click "Select Users" in the "Send Promotion To" dropdown
4. Click the "Filters" button to reveal advanced filtering options

### Main Filters At a Glance

| Filter | Options | Use Case |
|--------|---------|----------|
| **Subscription** | All Plans / Has Plan / No Plan | Target by payment status |
| **Request Activity** | All / Created / Fulfilled / Free / None | Find users by engagement type |
| **Days Active** | 1-365 | Find recently active users |
| **Creators Only** | On/Off | Show only creators |
| **Category** | Dynamic list | Target creator niches |
| **Min Requests** | 0+ | Exclude inactive users |
| **Min $/request** | 0+ | Target by earnings potential |

### Activity Badges Legend
```
💳 Has Plan      = User has paid subscription
📋 N Created     = User created N requests
✅ N Fulfilled   = User fulfilled N requests
🎁 N Free        = User created N free requests
🔥 Active        = User active in last 7 days
```

## Common Filtering Scenarios

### 1. Premium Creator Campaign
```
Creators Only:     ✓ (checked)
Subscription:      Has Plan
Days Active:       7
Result:            Recent active paid creators
```

### 2. Reactivate Inactive Users
```
Days Active:       30 (or more)
Subscription:      No Plan
Min Requests:      0
Result:            Inactive free users to re-engage
```

### 3. VIP User Rewards
```
Request Activity:  Fulfilled Requests
Days Active:       14
Min Requests:      5
Result:            Active, reliable workers
```

### 4. Free Trial Promotion
```
Subscription:      No Plan
Days Active:       30
Request Activity:  Created Requests
Result:            Engaged free users to convert
```

### 5. Feature Announcement
```
Days Active:       7
Min Requests:      1
Category:          (your target category)
Result:            Active users in specific niche
```

## Tips & Tricks

### Reset All Filters
Click the "Reset Filters" button to clear all selections and start fresh.

### Multiple Selection
- Click individual users to select/deselect
- Use "Select Visible" button to select all filtered users
- Selected count shows at the bottom

### Search + Filter
- Use search box for name/email matching
- Combine with filters for pinpoint targeting
- Example: Search "john" + Filter "Has Plan" = Plan-holding Johns

### Responsive Design
- Works on desktop, tablet, and mobile
- Filters adapt to screen size
- Touch-friendly on mobile devices

## Performance Tips

### For Large Promotions (10,000+ users)
1. Use more specific filters to reduce initial list
2. Combine multiple criteria (e.g., Subscription + Days Active)
3. Start with "Select Visible" and refine with more filters
4. Consider splitting into multiple smaller promotions

### Optimal Filter Order
1. Subscription status (biggest divide)
2. Days Active (engagement level)
3. Request Activity (type of engagement)
4. Category or Min Requests (fine-tuning)

## Data Definitions

### Subscription Plans
- **None/Free**: No active paid subscription
- **Starter**: Entry-level plan
- **Pro**: Mid-tier plan with more features
- **Creator**: For creators with higher limits
- **Brand**: Enterprise-level plan

### Request Activity Types
- **Created**: Posted a request for work
- **Fulfilled**: Completed/delivered work for payment
- **Free**: Requested free work
- **None**: No request history

### Activity Recency
- **Today (0 days)**: Last action today
- **Recently (1-7 days)**: Active this week
- **Moderately (7-30 days)**: Active this month
- **Inactive (30+ days)**: No recent activity

## Metrics Behind the Badges

### 💳 Has Plan
```
Source: user.subscriptionPlan
Shown if: plan !== 'none' && plan !== 'free'
Value: User's subscription tier displayed
```

### 📋 N Created
```
Source: Count of requests where createdBy = user.id
Shown if: Count > 0
Example: 📋 5 Created = User created 5 requests
```

### ✅ N Fulfilled
```
Source: Count of requests where claimedBy.id = user.id && currentStep = 6
Shown if: Count > 0
Example: ✅ 3 Fulfilled = User completed 3 requests
```

### 🎁 N Free
```
Source: Count of requests where createdBy = user.id && amount = 0
Shown if: Count > 0
Example: 🎁 2 Free = User created 2 free requests
```

### 🔥 Active
```
Source: daysSinceLastActivity
Shown if: daysSinceLastActivity <= 7
Meaning: User took action within last 7 days
```

## FAQ

**Q: How often are metrics updated?**
A: Calculated fresh each time you load the Staff Dashboard. No periodic background updates.

**Q: Can I save filter combinations?**
A: Not yet - in development for Phase 2. Currently must reapply filters each time.

**Q: Will filters slow down my browser?**
A: No - all filtering happens instantly client-side after metrics load once.

**Q: Can I export filtered user lists?**
A: Not yet - coming in Phase 2. Currently can only use for promotions within the app.

**Q: Are metrics historically tracked?**
A: Only current snapshot. Historical trends coming in Phase 3 Analytics Dashboard.

**Q: What if I select 10,000 users?**
A: System handles it, but recommended to break into smaller segments for better results.

**Q: Can creators see their own metrics?**
A: No - metrics visible to staff only for targeting promotions and analyzing user base.

**Q: Are inactive users filtered automatically?**
A: No - they're included by default. Use "Days Active" filter to exclude them if desired.

**Q: Can I preview the promotion before sending?**
A: Yes - scroll down to "Preview - How Users Will See It" section before sending.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus search box | Ctrl+K (or Cmd+K on Mac) |
| Apply filters | Enter |
| Toggle filter panel | Alt+F |
| Reset filters | Ctrl+Shift+R |
| Select all visible | Ctrl+A |

## Troubleshooting

### Metrics not showing?
1. Clear browser cache (Ctrl+Shift+Del)
2. Refresh page (F5)
3. Check backend server is running
4. Check browser console for errors (F12)

### Filters not working?
1. Ensure metrics loaded (check for values in user cards)
2. Check that users match your filter criteria
3. Try resetting filters and applying again
4. Verify backend endpoint is accessible

### Performance issues?
1. Use more specific filters first
2. Close unnecessary browser tabs
3. Avoid selecting too many users at once
4. For 10,000+ users, contact admin about pagination

### UI looks broken?
1. Update browser to latest version
2. Try different browser (Chrome, Firefox, Safari)
3. Clear browser cache completely
4. Report issue with browser/version details

## Contact & Support

**Questions about filtering?**
Check the detailed guides:
- METRICS_AND_FILTERING_GUIDE.md
- PROMOTION_MODAL_UI_GUIDE.md

**Want to extend to Users/Creators pages?**
See: IMPLEMENTING_METRICS_USERS_CREATORS_PAGES.md

**Technical issues?**
1. Check METRICS_SYSTEM_SUMMARY.md troubleshooting section
2. Review backend logs for `/staff/user-metrics` endpoint
3. Check StaffDashboard.jsx console for frontend errors

---

**Last Updated:** January 20, 2026
**Feature Version:** 1.0 (Production Ready)
**Status:** ✅ Active & Stable
