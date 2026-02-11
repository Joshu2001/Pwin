# Staff Admin Dashboard - Quick Start Guide

## 🎯 Quick Access

1. Go to the app and click **More** in the footer
2. Click the **Staff** button (Shield icon)
3. Login or create an account

---

## 🔑 Default Admin Account

| Field | Value |
|-------|-------|
| **Employee ID** | `1000` |
| **Password 1** | `@RegaarderHQ` |
| **Password 2** | `In2026` |
| **Password 3** | `Launchyear` |

---

## 📱 Dashboard Sections

### 1. Report Queue (for all staff)
- **What**: All videos flagged by users
- **Actions**:
  - Review reason for report
  - Shadow Delete (hides from public, keeps data)
- **Status**: Shows pending reports

### 2. Shadow Deleted (for all staff)
- **What**: Videos hidden by staff
- **Actions**:
  - View deletion reason
  - Restore video (when ready)
- **Status**: Tracks all hidden content

### 3. Account Approvals (admin ID 1000 only)
- **What**: Pending staff account requests
- **Actions**:
  - Approve (activate account)
  - Deny (reject request)
- **Status**: Shows all pending applications

---

## 👥 Creating New Staff Accounts

### As Admin:
1. Share this process with your team
2. Wait for their account request
3. Go to Staff Dashboard → Account Approvals
4. Click **Approve** to activate

### As New Staff:
1. Click Staff → Create Account
2. Enter:
   - Employee ID (your staff number)
   - Full Name
   - Email
   - Create 3 passwords (you'll need these to login)
3. Submit request
4. Wait for admin approval
5. Once approved, use Employee ID + 3 passwords to login

---

## 🎬 Content Moderation Workflow

```
User Reports Video
        ↓
Report appears in Queue
        ↓
Staff Reviews Report
        ↓
Staff chooses:
├─ Shadow Delete (hide from public)
└─ Ignore (no action)
        ↓
Video moves to Shadow Deleted tab
        ↓
Staff can Restore if needed
```

---

## 🔒 Security Notes

- Each staff account has 3 independent passwords
- All passwords must be correct to login
- Only admin can approve new accounts
- Session stored locally (logout to clear)
- Different from user login system

---

## ⚙️ Admin Tasks (ID 1000)

### Daily
- Check Report Queue
- Review flagged videos
- Shadow delete or ignore reports
- Monitor Shadow Deleted log

### Weekly
- Review pending staff accounts
- Approve new team members
- Check staff activity

### When Issues Arise
- Shadow delete problematic content
- Review user flags
- Restore videos if flagged in error

---

## 💡 Pro Tips

1. **Shadow Delete First, Review Later**: Hide content while investigating
2. **Keep History**: All actions are logged with timestamps
3. **Restore Option**: You can undo shadow deletes anytime
4. **New Staff**: Create accounts before they need access
5. **Passwords**: Each staff member chooses their own 3 passwords

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Incorrect credentials" | Check all 3 passwords exactly |
| "Employee not found" | ID might not exist, request account |
| "Unauthorized" | Only admin can access approvals |
| "Account inactive" | Admin hasn't approved yet |
| Can't see anything | Try logging out and back in |

---

## 📊 What Gets Tracked

✓ Video reports (why, when, who)
✓ Shadow deleted videos (reason, staff member, timestamp)
✓ New staff accounts (pending, approved, denied)
✓ All staff actions (deletion, restoration, approvals)

---

## 🚀 Ready to Use

The system is fully functional! 

**Admin (ID 1000)**: Can do everything
**Moderators**: Can review reports and shadow delete
**New Staff**: Apply for account, wait for approval

Questions? Check the full documentation: [STAFF_ADMIN_DASHBOARD.md](./STAFF_ADMIN_DASHBOARD.md)
