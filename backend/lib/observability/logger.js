import pino from 'pino';
import pinoHttp from 'pino-http';

const randomId = () => Math.random().toString(36).slice(2, 10);

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
