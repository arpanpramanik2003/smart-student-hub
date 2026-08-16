import pino from 'pino';
import pinoHttp from 'pino-http';

const randomId = () => Math.random().toString(36).slice(2, 10);

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.headers["x-api-key"]',
  '*.password',
  '*.token',
  '*.secret',
  '*.adminResetCode',
  'password',
  'token',
  'secret',
];

const reqSerializer = (req) => {
  if (!req) return undefined;
  const rawHeaders = req.raw?.headers || req.headers || {};
  return {
    id: req.id,
    method: req.method,
    url: req.url || req.originalUrl,
    ip: rawHeaders['x-forwarded-for']?.split(',')[0]?.trim() || req.remoteAddress || req.socket?.remoteAddress,
    userAgent: rawHeaders['user-agent'] || 'unknown',
  };
};

const resSerializer = (res) => {
  if (!res) return undefined;
  return {
    statusCode: res.statusCode,
  };
};

let defaultLogger = null;

export const createLogger = (config = {}) => {
  const logLevel = config.logLevel || process.env.LOG_LEVEL || 'info';
  const nodeEnv = config.nodeEnv || process.env.NODE_ENV || 'development';
  const serviceName = config.tracingServiceName || process.env.OTEL_SERVICE_NAME || 'campussphere-backend';
  const isPretty = process.env.LOG_PRETTY === 'true' || (nodeEnv === 'development' && process.env.LOG_PRETTY !== 'false');

  const pinoConfig = {
    level: logLevel,
    base: {
      service: serviceName,
      env: nodeEnv,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
  };

  if (isPretty) {
    return pino({
      ...pinoConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
          singleLine: false,
        },
      },
    });
  }

  return pino(pinoConfig);
};

export const getLogger = () => {
  if (!defaultLogger) {
    defaultLogger = createLogger();
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

export const createRequestLogger = (customLogger) => {
  const logInstance = customLogger || getLogger();

  return pinoHttp({
    logger: logInstance,
    quietReqLogger: true,
    serializers: {
      req: reqSerializer,
      res: resSerializer,
      err: pino.stdSerializers.err,
    },
    customLogLevel: (req, res, error) => {
      if (error || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    genReqId: (req, res) => {
      const headerValue = req.headers['x-request-id'];
      const requestId = Array.isArray(headerValue) ? headerValue[0] : headerValue || `req_${randomId()}`;
      res.setHeader('X-Request-Id', requestId);
      return requestId;
    },
    customAttributeKeys: {
      req: 'req',
      res: 'res',
      err: 'err',
      responseTime: 'durationMs',
    },
    customSuccessMessage: (req, res, responseTime) => {
      return `${req.method} ${req.url || req.originalUrl} -> ${res.statusCode} (${Math.round(responseTime)}ms)`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url || req.originalUrl} -> ${res.statusCode} (${err.message})`;
    },
  });
};
