# Observability Guide: Logs, Metrics & Tracing

## Architecture Overview

The Smart Student Hub backend implements a comprehensive observability stack with three core technologies:

| Technology | Status | Configuration | Implementation |
|-----------|--------|--------|----------|
| **Pino Logging** | Active | `LOG_LEVEL=debug/info` | `backend/lib/observability/logger.js` |
| **Prometheus Metrics** | Enabled | `METRICS_ENABLED=true` | `backend/lib/observability/metrics.js` |
| **OpenTelemetry Tracing** | Enabled | `TRACING_EXPORTER=console` | `backend/lib/observability/tracing.js` |

---

## 1️⃣ LOGGING: Pino

### Overview
Structured logging is implemented using Pino, which outputs JSON-formatted logs to standard output. This enables easy parsing and aggregation in cloud platforms like Render.

### Log Format Example
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

### Log Levels

The following log levels are available, ordered by severity:

```
trace (10) - Very detailed debugging information
debug (20) - Debugging information
info (30)  - General informational messages (production default)
warn (40)  - Warning messages
error (50) - Error messages
fatal (60) - Fatal errors
```

### Configuration

Log level is controlled via the `LOG_LEVEL` environment variable:

- **Development:** `LOG_LEVEL=debug`
- **Production:** `LOG_LEVEL=info`

Set in environment configuration and redeploy to take effect.

### Log Attributes

- **Service Name:** Identifies the backend service (from `OTEL_SERVICE_NAME`)
- **Timestamp Format:** ISO 8601 UTC
- **Request ID:** Auto-generated or extracted from `x-request-id` header for tracing
- **Response Time:** Measured in milliseconds

---

## 2️⃣ METRICS: Prometheus

### Overview
Prometheus metrics collection is enabled by default, providing visibility into HTTP request patterns and Node.js runtime performance.

### Metrics Collected
- HTTP request count by method, route, and status code
- HTTP request duration (latency histogram with predefined buckets)
- Node.js runtime metrics (memory usage, CPU, garbage collection)
- Event loop lag

### Metrics Endpoint
```
GET /api/metrics
```

Returns metrics in Prometheus text format for scraping.

### Example Metrics Output
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

### Integration Options

#### Option 1: Cloud Platform Dashboard
Access built-in metrics in cloud provider dashboards (e.g., Render) for CPU, memory, and network monitoring.

#### Option 2: Grafana Cloud (Recommended for Visualization)
1. Create account: https://grafana.com/products/cloud
2. Create stack to obtain Prometheus Remote Write URL
3. Set environment variables:
   ```
   PROMETHEUS_REMOTE_URL=https://prometheus-remote.grafana.com/api/prom/push
   PROMETHEUS_REMOTE_TOKEN=your_token
   METRICS_ENABLED=true
   ```

#### Option 3: Self-Hosted Prometheus
Deploy Prometheus instance with scrape configuration:
```yaml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'smart-student-hub-backend'
    static_configs:
      - targets: ['backend-host:10000']
    metrics_path: '/api/metrics'
```

---

## 3️⃣ TRACING: OpenTelemetry

### Overview
Distributed tracing is implemented using OpenTelemetry, enabling visibility into request flows and performance bottlenecks.

### Data Captured
- Request flow through service boundaries
- Database operation timings
- HTTP call latencies
- Error details and stack traces
- Span relationships and causality

### Current Configuration
```
TRACING_ENABLED=true
TRACING_EXPORTER=console
```

### Default Behavior: Console Exporter
When `TRACING_EXPORTER=console`, span data is written to standard output alongside application logs.

Example console output:
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

### Integration Options

#### Option 1: Jaeger (Open Source)
Jaeger provides a distributed tracing backend with UI for trace analysis.

Configuration:
```
TRACING_ENABLED=true
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger-backend:4317
```

Access Jaeger UI at configured endpoint (typically port 16686).

#### Option 2: Datadog
Commercial observability platform with integrated tracing.

Configuration:
```
TRACING_ENABLED=true
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://opentelemetry.datadoghq.com:443/v1/traces
DD_API_KEY=your_api_key
```

#### Option 3: Elastic Cloud
Elastic's observability solution including APM.

Configuration:
```
TRACING_ENABLED=true
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://apm-server:8200
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

## Quick Reference

### Prometheus Metrics Access
Metrics are available at the `/api/metrics` endpoint in Prometheus text format.

### OpenTelemetry Console Tracing
By default, traces are exported to console output via `TRACING_EXPORTER=console`.

### Production Trace Export
To enable external trace export:
1. Set `TRACING_EXPORTER=otlp`
2. Configure `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` 
3. Redeploy application

## Visualization & Monitoring Tools

### For Metrics Analysis
- **Grafana:** Recommended for dashboard creation and metric visualization
- **Prometheus UI:** Basic metric querying and graphing
- **Cloud Provider Dashboard:** Platform-specific monitoring (e.g., Render metrics)

### For Trace Analysis
- **Jaeger UI:** Trace search, service map dependencies, performance analysis
- **Datadog APM:** Commercial solution with ML-powered anomaly detection
- **Elastic APM:** Integrated application performance monitoring

### Implementation Flow
```
Application
    ↓
Pino Logger → Structured JSON Logs
    ↓
Prometheus Exporter → /api/metrics endpoint
    ↓
OpenTelemetry Tracer → Console or OTLP backend
    ↓
Visualization (Grafana/Jaeger/Datadog)
```
