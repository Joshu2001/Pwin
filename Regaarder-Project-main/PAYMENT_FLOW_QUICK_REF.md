# Payment Flow - Quick Reference

## What Was Added

A complete payment processing system that:
1. Initializes payment sessions before redirecting to PayPal
2. Handles success/failure callbacks from PayPal
3. Updates user subscriptions in database
4. Delivers subscription benefits immediately
5. Shows subscription status to users

---

## Key Endpoints

### Initialize Payment
```
POST /payment/init
Authorization: Bearer TOKEN
{
  "amount": 15,
  "paymentType": "subscription",
  "subscriptionTier": "Enthusiast",
  "paymentMode": "monthly"
}
```

### Handle Success
```
POST /payment/success
Authorization: Bearer TOKEN
{
  "sessionId": "payment_1704067200000_123456",
  "transactionId": "paypal_..."
}
```

### Handle Failure
```
POST /payment/failure
Authorization: Bearer TOKEN
{
  "sessionId": "payment_1704067200000_123456",
  "reason": "User cancelled"
}
```

### Get Status
```
GET /payment/subscription
Authorization: Bearer TOKEN
```

### Cancel
```
POST /payment/subscription/cancel
Authorization: Bearer TOKEN
```

---

## How It Works

### Step 1: User Initiates Payment
User selects tier in `SponsorPopup` (creatorprofile.jsx):
```javascript
const processPayment = async (mode, amount) => {
  // Initialize session
  const res = await fetch('/payment/init', {
    method: 'POST',
    headers: {'Authorization': `Bearer ${token}`},
    body: JSON.stringify({amount, paymentType: 'subscription', ...})
  });
  
  const {sessionId} = await res.json();
  
  // Store session
  localStorage.setItem('pending_payment_session', JSON.stringify({sessionId, ...}));
  
  // Redirect to PayPal
  window.location.href = "https://www.paypal.com/...";
};
```

### Step 2: User Pays on PayPal
PayPal processes payment and redirects back with:
- `?payment_success=true&transaction_id=...`
- or `?payment_failed=true`

### Step 3: App Detects Return
App.jsx callback handler (useEffect):
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment_success') === 'true') {
    // Call /payment/success
    // Activate subscription
    // Redirect to /subscriptions
  }
}, []);
```

### Step 4: Subscription Activated
Backend updates user:
```json
{
  "subscriptionTier": "enthusiast",
  "subscriptionActive": true,
  "subscriptionExpiryDate": "2025-02-28T...",
  "subscriptionBenefits": [
    "All Support perks",
    "Monthly Q&A access",
    "Name in credits",
    "Exclusive content"
  ]
}
```

### Step 5: User Sees Subscription
Subscriptions page fetches `/payment/subscription`:
- Shows tier name, price, expiry date
- Lists all active benefits
- Allows cancellation

---

## Data Storage

User object now includes:
```javascript
subscriptionTier      // 'support', 'enthusiast', 'patron', etc
subscriptionActive    // true/false
subscriptionStartDate // ISO date
subscriptionExpiryDate // ISO date
paymentMode           // 'monthly' or 'one-time'
subscriptionBenefits  // array of benefits
paymentSessions       // array of payment sessions
paymentHistory        // array of completed payments
```

---

## Benefits by Tier

### Support ($5/month)
- Early access to videos
- Supporter badge
- Direct support access

### Enthusiast ($15/month)
- All Support perks
- Monthly Q&A access
- Name in credits
- Exclusive content

### Patron ($50/month)
- All Enthusiast perks
- 1-on-1 consultation (quarterly)
- Custom video request priority
- VIP access to events

---

## Using Benefits in Your Code

### Check if User Has Subscription
```javascript
const isSubscribed = user.subscriptionActive && 
                    new Date(user.subscriptionExpiryDate) > new Date();
```

### Check for Specific Benefit
```javascript
const hasCustomVideoPriority = user.subscriptionBenefits?.includes(
  'Custom video request priority'
);
```

### Show Renewal Date
```javascript
const daysRemaining = Math.ceil(
  (new Date(user.subscriptionExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
);
```

---

## Error Handling

### Session Expires
- 15-minute window from creation
- User must complete payment within this time
- If expired, user starts over

### Payment Fails
- Logged with failure reason
- User can retry immediately
- No subscription activated

### Network Error
- User sees error message
- Can click retry button
- Payment session remains valid

---

## Testing

### Test Successful Payment
1. Go to SponsorPopup
2. Select tier
3. Enter amount
4. Click pay
5. Mock PayPal redirect with `?payment_success=true`
6. Verify user in `/subscriptions` shows subscription

### Test Failed Payment
1. Follow same steps
2. Mock PayPal redirect with `?payment_failed=true`
3. Verify error message shown
4. Verify user can retry

### Check Database
```javascript
// In users.json, find user and check:
user.subscriptionTier       // Should be set
user.subscriptionActive     // Should be true
user.subscriptionExpiryDate // Should be future date
user.subscriptionBenefits   // Should have array of benefits
```

---

## Common Tasks

### Grant Subscription Manually (Admin)
```javascript
// In backend, find user and set:
user.subscriptionTier = 'enthusiast';
user.subscriptionActive = true;
user.subscriptionStartDate = new Date().toISOString();
user.subscriptionExpiryDate = new Date(Date.now() + 30*24*60*60*1000).toISOString();
user.subscriptionBenefits = ['...'];
writeUsers(users);
```

### Check User Benefits in Route
```javascript
app.get('/api/feature', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  
  const hasAccess = user.subscriptionBenefits?.includes('Feature Name');
  if (!hasAccess) {
    return res.status(403).json({error: 'Premium feature'});
  }
  
  // Grant access
});
```

### Send Renewal Reminder
```javascript
// Cron job or endpoint
const expiringUsers = users.filter(u => {
  const daysRemaining = Math.ceil(
    (new Date(u.subscriptionExpiryDate) - new Date()) / (1000*60*60*24)
  );
  return daysRemaining === 3 && u.subscriptionActive;
});

// Send email: "Your subscription expires in 3 days"
```

---

## Files Changed

| File | Changes |
|------|---------|
| backend/server.js | Added 5 payment endpoints |
| src/App.jsx | Added callback handler |
| src/creatorprofile.jsx | Enhanced payment flow |
| src/subscriptions.jsx | Show subscription status |

---

## Status Codes

### `/payment/init`
- 200: Session created
- 400: Invalid amount or missing fields
- 404: User not found
- 500: Server error

### `/payment/success`
- 200: Subscription activated
- 400: Invalid session, expired, or already processed
- 404: Session not found or user not found
- 500: Server error

### `/payment/subscription`
- 200: Returns subscription status
- 404: User not found
- 500: Server error

---

## Next: Integrate with PayPal

1. Get real PayPal client ID
2. Configure return URLs:
   - Success: `yourdomain.com?payment_success=true`
   - Failure: `yourdomain.com?payment_failed=true`
3. Update payment link in processPayment()
4. Add order validation webhook (optional)

---

## Support

If users aren't receiving benefits:
1. Check `/payment/subscription` shows active subscription
2. Verify `subscriptionExpiryDate` hasn't passed
3. Check `subscriptionBenefits` array isn't empty
4. Check feature code checks benefits correctly
