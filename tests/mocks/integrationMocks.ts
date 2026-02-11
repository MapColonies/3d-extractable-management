import type { Tracer, Span, SpanOptions, Context } from '@opentelemetry/api';
import type { Logger } from '@map-colonies/js-logger';
import { IConfig } from '@src/common/interfaces';

export const createSpanMock = (): Span =>
  ({
    setAttribute: jest.fn(),
    setAttributes: jest.fn(),
    addEvent: jest.fn(),
    setStatus: jest.fn(),
    updateName: jest.fn(),
    end: jest.fn(),
    isRecording: jest.fn().mockReturnValue(true),
    recordException: jest.fn(),
    addLink: jest.fn(),
  }) as unknown as Span;

export const createTracerMock = (): Tracer =>
  ({
    startActiveSpan: (
      name: string,
      fnOrOptions?: SpanOptions | ((span: Span) => unknown),
      fnOrContext?: Context | ((span: Span) => unknown),
      fn?: (span: Span) => unknown
    ) => {
      const span = createSpanMock();

      let callback: ((span: Span) => unknown) | undefined;
      if (typeof fnOrOptions === 'function') {
        callback = fnOrOptions;
      } else if (typeof fnOrContext === 'function') {
        callback = fnOrContext;
      } else if (fn) {
        callback = fn;
      }

      if (!callback) return span;

      try {
        const result = callback(span);
        if (result instanceof Promise) {
          return result.finally(() => span.end());
        } else {
          span.end();
          return result;
        }
      } catch (error) {
        span.end();
        throw error;
      }
    },
    startSpan: jest.fn(),
  }) as unknown as Tracer;

export const createLoggerMock = (): Logger =>
  ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  }) as unknown as Logger;

export const createConfigMock = (): jest.Mocked<IConfig> =>
  ({
    get: jest.fn(),
    has: jest.fn(),
  }) as unknown as jest.Mocked<IConfig>;

export const configureIntegrationConfigMock = (
  mockedConfig: jest.Mocked<typeof import('config')>,
  options: {
    dbConfig: unknown;
    userCredentials: { username: string; password: string };
    catalogUrl?: string;
    routes?: { url: string }[];
  }
): void => {
  const {
    dbConfig,
    userCredentials,
    catalogUrl = 'http://127.0.0.1:8080',
    routes = [{ url: 'https://linl-to-env1' }, { url: 'https://linl-to-env12' }],
  } = options;

  mockedConfig.get.mockImplementation((key: string) => {
    if (key === 'db') {
      return dbConfig;
    }
    if (key === 'users') {
      return [{ username: userCredentials.username, password: userCredentials.password }];
    }
    if (key === 'externalServices.publicExtractableRoutes') {
      return routes;
    }
    if (key === 'externalServices.catalog') {
      return catalogUrl;
    }
    return undefined;
  });
};

export const getCatalogCallMock = (): Record<string, jest.Mock> => ({
  findPublishedRecord: jest.fn().mockResolvedValue(true),
});

export const getAxiosPostMockResponse = (overrides?: { isValid?: boolean }): { data: { isValid: boolean } } => ({
  data: {
    isValid: overrides?.isValid ?? true,
  },
});
