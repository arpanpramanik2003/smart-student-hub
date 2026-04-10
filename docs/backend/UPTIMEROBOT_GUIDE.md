# UptimeRobot Configuration Guide

## Overview

Render's free tier suspends applications after 15 minutes of inactivity. UptimeRobot pings the health endpoint every 5 minutes to maintain application availability.

---

## Health Monitoring Endpoint

**Endpoint:** `/api/health`

**HTTP Method:** `GET`

**Authentication:** Not required

**Response Time:** < 100ms

**Status Codes:**
- `200 OK` - Application and database operational
- `500 Internal Server Error` - Database connectivity issue

**Response Payload:**
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

## UptimeRobot Monitor Configuration

### Prerequisites
- UptimeRobot account (free tier sufficient)
- Health endpoint URL (from backend deployment)

### Monitor Setup

**Monitor Type:** HTTP(s)

**Configuration Parameters:**

| Parameter | Value |
|-----------|-------|
| URL | `/api/health` endpoint of backend service |
| Friendly Name | Smart Student Hub Backend |
| Check Interval | 5 minutes |
| Timeout | 30 seconds |
| HTTP Method | GET |
| HTTP Authentication | None |

### Verification

Monitor status can be verified through the UptimeRobot dashboard:
- **Status:** "Up" indicates successful health checks
- **Check History:** Available for inspection and analysis
- **Uptime Statistics:** Calculated from successful/failed checks

---

## Performance Characteristics

### Check Frequency
With 5-minute intervals, the health endpoint receives ~288 requests per day from UptimeRobot.

### Load Impact
- Minimal overhead per request (< 100ms response time)
- Database connection validation occurs with each check
- No authentication required

### Availability Behavior
- Application remains in active state with regular health checks
- Free tier Render instances do not suspend when receiving pings
- Database remains warm and responsive

---

## Monitoring Enhancements

### Health Check Status

Successful health checks indicate:
- Application process running
- Express server listening
- Database connectivity established
- All core services operational

### Alert Configuration

Optional: Configure notification channels via UptimeRobot:
- Email alerts on failure
- Webhook integration
- SMS notifications (free tier limited)

---

## Integration with Production

The health endpoint serves as the monitoring mechanism for production deployments:
- Validates application state continuously
- Provides early warning for service degradation
- Enables automatic alerting for reliability teams

This pattern ensures the backend remains consistently available without manual intervention.
