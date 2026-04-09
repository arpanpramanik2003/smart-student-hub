const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parseNumber = (value, fallback, { min = 0 } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return parsed;
};

const parseOrigins = (rawOrigins) => {
  if (!rawOrigins || rawOrigins.trim() === '') {
    return ['*'];
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseString = (value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  return String(value).trim();
};

const resolveDbSyncStrategy = (value, isProduction) => {
  const defaultValue = isProduction ? 'none' : 'safe';
  const normalized = (value || defaultValue).trim().toLowerCase();
  const allowed = new Set(['none', 'safe', 'alter']);

  if (!allowed.has(normalized)) {
    throw new Error('DB_SYNC_STRATEGY must be one of: none, safe, alter');
  }

  return normalized;
};

const resolveRateLimitBackend = (value) => {
  const normalized = (value || 'auto').trim().toLowerCase();
  const allowed = new Set(['auto', 'memory', 'redis', 'upstash']);
  if (!allowed.has(normalized)) {
    throw new Error('AUTH_RATE_LIMIT_BACKEND must be one of: auto, memory, redis, upstash');
  }

  return normalized;
};

const resolveTracingExporter = (value, isProduction) => {
  const defaultExporter = isProduction ? 'none' : 'console';
  const normalized = (value || defaultExporter).trim().toLowerCase();
  const allowed = new Set(['none', 'console', 'otlp']);

  if (!allowed.has(normalized)) {
    throw new Error('TRACING_EXPORTER must be one of: none, console, otlp');
  }

  return normalized;
};

export const loadConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const dbPath = process.env.DB_PATH || process.env.DB_NAME;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && !dbPath) {
    throw new Error('Database is not configured. Set DATABASE_URL (Postgres) or DB_PATH/DB_NAME (SQLite).');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'CHANGE_ME_IN_PRODUCTION') {
    if (isProduction) {
      throw new Error('JWT_SECRET must be configured with a strong value in production.');
    }
  }

  const requestBodyLimitMb = parseNumber(process.env.REQUEST_BODY_LIMIT_MB, 50, { min: 1 });

  return Object.freeze({
    nodeEnv,
    isProduction,
    port: parseNumber(process.env.PORT, 5001, { min: 1 }),
    trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
    corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
    exposeLocalUploads: parseBoolean(process.env.EXPOSE_LOCAL_UPLOADS, true),
    uploadsCacheControlMaxAge: process.env.UPLOADS_CACHE_CONTROL_MAX_AGE || '1h',
    requestBodyLimit: `${requestBodyLimitMb}mb`,
    requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 30000, { min: 1000 }),
    shutdownTimeoutMs: parseNumber(process.env.SHUTDOWN_TIMEOUT_MS, 10000, { min: 1000 }),
    dbSyncStrategy: resolveDbSyncStrategy(process.env.DB_SYNC_STRATEGY, isProduction),
    authRateLimitWindowMs: parseNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000, { min: 1000 }),
    authRateLimitMax: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 20, { min: 1 }),
    authRateLimitBackend: resolveRateLimitBackend(process.env.AUTH_RATE_LIMIT_BACKEND),
    redisUrl: process.env.REDIS_URL || '',
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    logLevel: parseString(process.env.LOG_LEVEL, isProduction ? 'info' : 'debug'),
    metricsEnabled: parseBoolean(process.env.METRICS_ENABLED, true),
    metricsPath: parseString(process.env.METRICS_PATH, '/metrics'),
    metricsPrefix: parseString(process.env.METRICS_PREFIX, 'ssh_backend_'),
    tracingEnabled: parseBoolean(process.env.TRACING_ENABLED, true),
    tracingExporter: resolveTracingExporter(process.env.TRACING_EXPORTER, isProduction),
    tracingServiceName: parseString(process.env.OTEL_SERVICE_NAME, 'smart-student-hub-backend'),
    otlpTracesEndpoint: parseString(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, ''),
  });
};
