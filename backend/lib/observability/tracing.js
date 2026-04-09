import { context, propagation, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const createNoopTracing = () => ({
  middleware: (req, res, next) => next(),
  shutdown: async () => {},
});

const getExporter = (config) => {
  if (config.tracingExporter === 'none') {
    return null;
  }

  if (config.tracingExporter === 'otlp') {
    if (!config.otlpTracesEndpoint) {
      throw new Error('TRACING_EXPORTER=otlp requires OTEL_EXPORTER_OTLP_TRACES_ENDPOINT');
    }

    return new OTLPTraceExporter({
      url: config.otlpTracesEndpoint,
    });
  }

  return new ConsoleSpanExporter();
};

export const initTracing = async (config, logger) => {
  if (!config.tracingEnabled) {
    return createNoopTracing();
  }

  const exporter = getExporter(config);
  if (!exporter) {
    return createNoopTracing();
  }

  const spanProcessor = config.tracingExporter === 'console'
    ? new SimpleSpanProcessor(exporter)
    : new BatchSpanProcessor(exporter);

  const provider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });

  provider.register();
  const tracer = trace.getTracer(config.tracingServiceName);
  logger.info({ exporter: config.tracingExporter }, 'Tracing initialized');

  const middleware = (req, res, next) => {
    const extracted = propagation.extract(context.active(), req.headers);
    const span = tracer.startSpan(
      `${req.method} ${req.path}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.route': req.path,
          'http.target': req.originalUrl,
        },
      },
      extracted
    );

    const spanContext = span.spanContext();
    res.setHeader('X-Trace-Id', spanContext.traceId);

    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      if (res.statusCode >= 500) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();
    });

    const ctx = trace.setSpan(extracted, span);
    context.with(ctx, () => next());
  };

  return {
    middleware,
    shutdown: async () => {
      await provider.shutdown();
    },
  };
};
