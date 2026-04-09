import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import { registerRoutes } from './lib/routeLoader.js';
import { initDB } from './lib/database.js';
import { loadConfig } from './lib/config.js';
import { createAuthRateLimiter } from './lib/rateLimiter.js';
import { createLogger, createRequestLogger } from './lib/observability/logger.js';
import { createMetrics } from './lib/observability/metrics.js';
import { initTracing } from './lib/observability/tracing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
const config = loadConfig();
const logger = createLogger(config);

const app = express();
const port = config.port;

app.set('trust proxy', config.trustProxy);

app.disable('x-powered-by');

const startTime = Date.now();
let isShuttingDown = false;
const authRateLimiter = await createAuthRateLimiter(config);
const tracing = await initTracing(config, logger);
const metrics = createMetrics(config, logger);

app.use(createRequestLogger(logger));
app.use(tracing.middleware);
app.use(metrics.middleware);
app.use(authRateLimiter.middleware);

app.use((req, res, next) => {
  if (!isShuttingDown) {
    next();
    return;
  }

  res.status(503).json({ message: 'Server is shutting down. Please retry shortly.' });
});

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = config.corsOrigins.includes('*');
  const originAllowed = requestOrigin && config.corsOrigins.includes(requestOrigin);

  if (requestOrigin && !allowAnyOrigin && !originAllowed) {
    res.status(403).json({ message: 'Origin is not allowed by CORS policy' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : (requestOrigin || config.corsOrigins[0]));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Location');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

app.use(express.raw({ type: () => true, limit: config.requestBodyLimit }));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const exposeLocalUploads = config.exposeLocalUploads;
const uploadsMaxAge = config.uploadsCacheControlMaxAge;

if (exposeLocalUploads) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir, {
    dotfiles: 'deny',
    maxAge: uploadsMaxAge,
    etag: true,
    index: false,
  }));
}

app.get('/', (req, res) => {
  res.json({
    name: 'Smart Student Hub backend',
    status: 'ok',
    apiBase: '/api',
  });
});

metrics.registerEndpoint(app);

app.get('/healthz/live', (req, res) => {
  res.json({
    status: 'alive',
    uptimeSec: Math.floor((Date.now() - startTime) / 1000),
  });
});

app.get('/healthz/ready', async (req, res) => {
  try {
    const { sequelize } = await initDB();
    await sequelize.authenticate();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not-ready' });
  }
});

await initDB();
await registerRoutes(app);

const server = app.listen(port, () => {
  logger.info({ port }, 'Express backend listening');
});

server.requestTimeout = config.requestTimeoutMs;
server.headersTimeout = config.requestTimeoutMs + 5000;
server.keepAliveTimeout = 5000;

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, 'Starting graceful shutdown');

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout reached. Forcing process exit.');
    process.exit(1);
  }, config.shutdownTimeoutMs);

  server.close(async (error) => {
    clearTimeout(forceExitTimer);
    if (error) {
      logger.error({ err: error }, 'Error while closing HTTP server');
      process.exit(1);
    }

    try {
      await authRateLimiter.close();
      await tracing.shutdown();
    } catch (closeError) {
      logger.error({ err: closeError }, 'Error while closing observability resources');
      process.exit(1);
    }

    logger.info('HTTP server closed cleanly');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  shutdown('unhandledRejection');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error({ port }, 'Port is already in use. Stop existing process or change PORT in backend/.env.');
    process.exit(1);
  }

  logger.error({ err: error }, 'Server startup error');
  process.exit(1);
});