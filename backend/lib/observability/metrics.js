import client from 'prom-client';

const resolveRouteLabel = (req) => {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }

  return req.path || 'unknown';
};

export const createMetrics = (config, logger) => {
  const registry = new client.Registry();

  if (!config.metricsEnabled) {
    return {
      middleware: (req, res, next) => next(),
      registerEndpoint: () => {},
    };
  }

  client.collectDefaultMetrics({
    register: registry,
    prefix: config.metricsPrefix,
  });

  const requestCounter = new client.Counter({
    name: `${config.metricsPrefix}http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  });

  const requestDuration = new client.Histogram({
    name: `${config.metricsPrefix}http_request_duration_seconds`,
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });

  const middleware = (req, res, next) => {
    const stopTimer = requestDuration.startTimer();

    res.on('finish', () => {
      const labels = {
        method: req.method,
        route: resolveRouteLabel(req),
        status_code: String(res.statusCode),
      };

      requestCounter.inc(labels);
      stopTimer(labels);
    });

    next();
  };

  const registerEndpoint = (app) => {
    app.get(config.metricsPath, async (req, res) => {
      try {
        res.setHeader('Content-Type', registry.contentType);
        res.end(await registry.metrics());
      } catch (error) {
        logger.error({ err: error }, 'Failed to serve metrics endpoint');
        res.status(500).json({ message: 'Metrics unavailable' });
      }
    });
  };

  return {
    middleware,
    registerEndpoint,
  };
};
