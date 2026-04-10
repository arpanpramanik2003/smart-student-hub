# Observability Guide: Logs, Metrics & Tracing

## Current Status ✅

Your backend has **all three** observability technologies already implemented:

| Technology | Status | Config | Location |
|-----------|--------|--------|----------|
| **Pino Logging** | ✅ ACTIVE | `LOG_LEVEL=debug/info` | `backend/lib/observability/logger.js` |
| **Prometheus Metrics** | ✅ ENABLED | `METRICS_ENABLED=true` | `backend/lib/observability/metrics.js` |
| **OpenTelemetry Tracing** | ✅ ENABLED | `TRACING_EXPORTER=console` | `backend/lib/observability/tracing.js` |

---

## 1️⃣ LOGGING: Pino (Currently Active)

### What You're Seeing in Render
The structured JSON logs in your Render dashboard are from **Pino**:

```json
{
  "level": 30,
  "time": "2026-04-10T04:39:37.154Z",
  "service": "smart-student-hub-backend",
  "env": "production",
  "port": 10000,
  "msg": "Express backend listening",
  "reqId": "req_i5f0hex0",
  "req": {
    "method": "POST",
    "url": "/api/auth/login",
    "headers": {...}
  },
  "res": {
    "statusCode": 200,
    "responseTime": 125
  }
}
```

### Log Levels Available
```
trace (10) -> Very detailed debugging
debug (20) -> Debugging information
info (30)  -> General informational messages ⬅️ PRODUCTION DEFAULT
warn (40)  -> Warning messages
error (50) -> Error messages
fatal (60) -> Fatal errors
```

### Configure Logging

**Development (Local):**
```bash
LOG_LEVEL=debug
```

**Production (Render):**
```bash
LOGS_LEVEL=info
```

Set in Render Dashboard:
1. Go to **Environment** → **Environment Variables**
2. Add: `LOG_LEVEL=info`
3. Deploy

### Log Output Stats
- **Service Name:** `smart-student-hub-backend` (from `OTEL_SERVICE_NAME`)
- **Timestamp Format:** ISO 8601 (UTC)
- **Request ID:** Auto-generated or from `x-request-id` header
- **Response Time:** In milliseconds

---

## 2️⃣ METRICS: Prometheus (Ready to Use)

### What It Tracks
Prometheus collects metrics on:
- HTTP request count by method/route/status
- HTTP request duration (latency histogram)
- Node.js runtime metrics (memory, CPU, GC)
- Event loop lag

### Endpoint
```
https://smart-student-hub-sj5o.onrender.com/api/metrics
```

### Sample Metrics Output
```
# HELP ssh_backend_http_requests_total Total number of HTTP requests
# TYPE ssh_backend_http_requests_total counter
ssh_backend_http_requests_total{method="POST",route="/api/auth/login",status_code="200"} 42

# HELP ssh_backend_http_request_duration_seconds HTTP request duration in seconds
# TYPE ssh_backend_http_request_duration_seconds histogram
ssh_backend_http_request_duration_seconds_bucket{le="0.005",method="POST",route="/api/auth/login",status_code="200"} 10
ssh_backend_http_request_duration_seconds_bucket{le="0.01",method="POST",route="/api/auth/login",status_code="200"} 32
ssh_backend_http_request_duration_seconds_bucket{le="0.025",method="POST",route="/api/auth/login",status_code="200"} 40
```

### Enable Prometheus Monitoring

#### Option 1: Use Render's Built-in Metrics (Free)
1. Go to Render Dashboard → Your Service
2. Click **"Metrics"** tab
3. View CPU, Memory, Network usage

#### Option 2: Send to Grafana Cloud (Free Tier)

1. **Create Grafana Cloud Account:**
   - Go to https://grafana.com/products/cloud
   - Sign up (free tier available)
   - Create stack (e.g., "ssh-backend")

2. **Get Prometheus Remote Write URL:**
   - Dashboard → Configuration → API Tokens
   - Create token with `metrics:write` permission
   - Copy Remote Write URL

3. **Install Prometheus Client:**
   ```bash
   npm install prom-client @prometheus/client
   ```

4. **Add Environment Variables in Render:**
   ```
   PROMETHEUS_REMOTE_URL=https://prometheus-remote.grafana.com/api/prom/push
   PROMETHEUS_REMOTE_TOKEN=your_token_here
   ```

5. **Update backend code** to send metrics (optional - we can add this)

#### Option 3: Self-Hosted Prometheus
1. Deploy Prometheus server
2. Add Render backend as scrape target:
   ```yaml
   global:
     scrape_interval: 15s
   scrape_configs:
     - job_name: 'smart-student-hub'
       static_configs:
         - targets: ['smart-student-hub-sj5o.onrender.com']
       metrics_path: '/api/metrics'
   ```
3. Visualize in Grafana

---

## 3️⃣ TRACING: OpenTelemetry (Ready to Setup)

### What It Tracks
Distributed tracing records:
- Request flow through services
- Database query times
- HTTP call latencies
- Error stack traces
- Span relationships

### Current Configuration
```
TRACING_ENABLED=true
TRACING_EXPORTER=console
```

### Output (Console Exporter)
Shows span data in your logs:
```json
{
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "timestamp": "2026-04-10T04:40:37.339Z",
  "duration": 125,
  "name": "POST /api/auth/login",
  "attributes": {
    "http.method": "POST",
    "http.route": "/api/auth/login",
    "http.status_code": 200
  }
}
```

### Enable OpenTelemetry Export

#### Option 1: Jaeger (Free & Open Source)

1. **Run Jaeger Locally (for testing):**
   ```bash
   docker run -d --name jaeger \
     -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
     -p 5775:5775/udp \
     -p 6831:6831/udp \
     -p 6832:6832/udp \
     -p 5778:5778 \
     -p 16686:16686 \
     -p 14250:14250 \
     -p 14268:14268 \
     -p 14269:14269 \
     -p 9411:9411 \
     jaegertracing/all-in-one:latest
   ```
   
   Access UI at: http://localhost:16686

2. **Deploy Jaeger to Production:**
   - Use Docker container on Render
   - Or use SaaS: Jaeger Cloud, Elastic Cloud, Datadog

3. **Add Environment Variables:**
   ```
   TRACING_ENABLED=true
   TRACING_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://your-jaeger:4317
   ```

#### Option 2: Datadog (Enterprise)

1. **Create Datadog Account:** https://www.datadoghq.com
2. **Get API Key** from Settings
3. **Set Environment Variables:**
   ```
   TRACING_ENABLED=true
   TRACING_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://opentelemetry.datadoghq.com:443/v1/traces
   DD_API_KEY=your_api_key
   ```

#### Option 3: Elastic Cloud (Free Tier)

1. **Create Elastic Cloud Account:** https://www.elastic.co/cloud
2. **Get APM Server Endpoint**
3. **Set Environment Variables:**
   ```
   TRACING_ENABLED=true
   TRACING_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://your-apm-server:8200
   OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer your_token
   ```

---

## Configuration Reference

### Backend Environment Variables

```bash
# LOGGING
LOG_LEVEL=info                                      # trace|debug|info|warn|error|fatal

# METRICS (Prometheus)
METRICS_ENABLED=true                               # Enable/disable metrics collection
METRICS_PATH=/metrics                              # Endpoint path for metrics export
METRICS_PREFIX=ssh_backend_                        # Prefix for metric names

# TRACING (OpenTelemetry)
TRACING_ENABLED=true                               # Enable/disable tracing
TRACING_EXPORTER=console                           # none|console|otlp
OTEL_SERVICE_NAME=smart-student-hub-backend        # Service identifier
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger:4317  # OTLP collector endpoint
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Student Hub Backend                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express Application                      │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↓              ↓              ↓                    │
│  ┌──────────────┐ ┌────────────┐ ┌────────────────┐         │
│  │   Pino       │ │ Prometheus │ │ OpenTelemetry  │         │
│  │  Logging     │ │   Metrics  │ │   Tracing      │         │
│  └──────────────┘ └────────────┘ └────────────────┘         │
│       ↓                 ↓                  ↓                  │
└───────┼─────────────────┼──────────────────┼────────────────┘
        │                 │                  │
        ↓                 ↓                  ↓
   Render Logs     GET /api/metrics    Jaeger/Datadog
   (Structured    (Prometheus Format)  (Distributed Traces)
    JSON)
```

---

## Quick Start

### To Enable Prometheus Metrics Endpoint NOW:
```bash
# Already enabled by default
curl https://smart-student-hub-sj5o.onrender.com/api/metrics
```

### To Enable OpenTelemetry Tracing to Console NOW:
```bash
# Already enabled, check Render logs for trace spans
```

### To Send Traces to Jaeger (Production):
1. Deploy Jaeger instance
2. Add to Render environment:
   ```
   TRACING_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=jaeger-endpoint
   ```
3. Redeploy backend

---

## Monitoring Dashboard (Next Step)

Once metrics and traces are enabled, visualize them:

**Option A: Grafana** (best for metrics)
- Connect datasource to Prometheus endpoint
- Create dashboards for request rates, latency, errors

**Option B: Jaeger UI** (best for tracing)
- Search traces by service, operation, duration
- Analyze request flow and bottlenecks

**Option C: Datadog/NewRelic** (all-in-one)
- Unified view of logs, metrics, traces
- AI-powered anomaly detection
- Custom alerting

---
