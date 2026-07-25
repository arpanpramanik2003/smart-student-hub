import pino from 'pino';
import pinoHttp from 'pino-http';

const randomId = () => Math.random().toString(36).slice(2, 10);

let defaultLogger = null;

export const createLogger = (config) => {
  return pino({
    level: config.logLevel,
    base: {
      service: config.tracingServiceName,
      env: config.nodeEnv,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};

export const getLogger = () => {
  if (!defaultLogger) {
    defaultLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      base: {
        service: process.env.OTEL_SERVICE_NAME || 'smart-student-hub-backend',
        env: process.env.NODE_ENV || 'development',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }
  return defaultLogger;
};

export const logger = new Proxy({}, {
  get(target, prop) {
    const instance = getLogger();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const createRequestLogger = (logger) => {
  return pinoHttp({
    logger,
    quietReqLogger: true,
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    genReqId: (req, res) => {
      const headerValue = req.headers['x-request-id'];
      const requestId = Array.isArray(headerValue) ? headerValue[0] : headerValue || `req_${randomId()}`;
      res.setHeader('X-Request-Id', requestId);
      return requestId;
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} completed with ${res.statusCode}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl} failed with ${res.statusCode}: ${err.message}`,
  });
};

