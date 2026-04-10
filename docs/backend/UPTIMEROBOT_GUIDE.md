# UptimeRobot Configuration Guide

## Problem Solved ✅
Render's free tier spins down inactive apps after 15 minutes of inactivity. By pinging the health endpoint every 5 minutes, your backend will stay active 24/7.

---

## Health Endpoint Details

**Endpoint URL:**
```
https://smart-student-hub-sj5o.onrender.com/api/health
```

**Method:** `GET`  
**Authentication:** None required  
**Response Time:** < 100ms  
**Status Codes:**
- `200 OK` - Backend and database are running normally
- `500 Internal Server Error` - Database connection issue

**Sample Response:**
```json
{
  "message": "Smart Student Hub API is running!",
  "timestamp": "2026-04-10T04:57:55.224Z",
  "version": "2.0.0",
  "database": "Connected ✅",
  "deployment": "Frontend + Express Backend"
}
```

---

## UptimeRobot Setup (Step-by-Step)

### Step 1: Create Free UptimeRobot Account
1. Go to https://uptimerobot.com
2. Click **"Sign Up"** (top right)
3. Enter email and create password
4. Verify email
5. Login to dashboard

### Step 2: Add New Monitor
1. Click **"+ Add New Monitor"** (top left)
2. Select **Monitor Type:** `HTTP(s)`

### Step 3: Configure Monitor
Fill in these fields:

| Field | Value |
|-------|-------|
| **URL** | `https://smart-student-hub-sj5o.onrender.com/api/health` |
| **Friendly Name** | `Smart Student Hub Backend` |
| **Check Interval** | `5 minutes` (keeps Render awake) |
| **Timeout** | `30 seconds` (default) |
| **HTTP Method** | `GET` |
| **HTTP Authentication** | Leave empty |

### Step 4: Notification Settings
1. Click **"Notification Settings"** (if shown)
2. Select **Alert Contacts** (email recommended)
3. Set **Notification Frequency** to `Hourly` (if down, notify hourly)

### Step 5: Create Monitor
Click **"Create Monitor"** button

---

## Verification ✅

After creating the monitor:

1. **Wait 2-3 minutes** for first check to complete
2. Go to **"Monitors"** in UptimeRobot dashboard
3. Look for `Smart Student Hub Backend` monitor
4. Status should show **"Up"** with green checkmark
5. Click monitor to see check history

---

## How It Works

```
UptimeRobot (every 5 min)
        ↓
GET /api/health
        ↓
Render Backend Wakes Up
        ↓
Database Check Passes
        ↓
Response: 200 OK
        ↓
Render Stays Awake
```

---

## Cost & Limits

✅ **Free UptimeRobot Plan:**
- 50 monitors
- 5-minute check interval
- Email alerts
- Unlimited monitoring time

This is perfect for keeping your Render backend alive 24/7.

---

## Troubleshooting

### Monitor shows "Down"
- Check Render dashboard - might be restarting
- Verify PostgreSQL database is connected
- Check Render logs for errors

### Monitor shows "Unknown"
- Wait a few minutes for first check
- Refresh UptimeRobot dashboard (F5)
- Verify URL is correct in monitor settings

### Too many checks (exceeding quota)
- UptimeRobot free tier is unlimited for basic monitoring
- No action needed

---

## Backend Remains Active

With 5-minute checks:
- Backend will **never** spin down
- Your users get **instant** app load times
- No cold starts on HTTP requests
- Database stays warm and responsive

---

## Optional: Add Alerts

You can receive alerts via:
- **Email** - Free
- **SMS** - Free (limited)
- **Slack** - Free (requires Slack workspace)
- **Discord** - Free (requires Discord server)

Configure in **"Notification Settings"** after creating monitor.

---
