import httpStatusCodes from 'http-status-codes';
import axios from 'axios';
import type { Tracer, Span, SpanOptions, Context } from '@opentelemetry/api';
import { Logger } from '@map-colonies/js-logger';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';
import { IConfig } from '@src/common/interfaces';
import { AppError } from '@src/utils/appError';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const createSpanMock = (): Span =>
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

const tracerMock: Tracer = {
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
} as unknown as Tracer;

describe('CatalogCall Integration (axios mocked)', () => {
  let catalogCall: CatalogCall;
  let configMock: jest.Mocked<IConfig>;
  let loggerMock: jest.Mocked<Logger>;

  beforeAll(() => {
    configMock = {
      get: jest.fn().mockReturnValue('http://mock-catalog-service'),
    } as unknown as jest.Mocked<IConfig>;

    loggerMock = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    catalogCall = new CatalogCall(configMock, loggerMock, tracerMock);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockClear();
  });

  it('should return true when record is found', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: httpStatusCodes.OK,
      data: [{ id: '123', name: 'rec_found', productStatus: 'PUBLISHED' }],
    });

    const result = await catalogCall.findRecord('rec_found');

    expect(result).toBe(true);
    expect(loggerMock.debug).toHaveBeenCalledWith(expect.objectContaining({ msg: expect.stringContaining("Record 'rec_found' found") as string }));
  });

  it('should return false when record is not found', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: httpStatusCodes.OK,
      data: [],
    });

    const result = await catalogCall.findRecord('rec_missing');
    expect(result).toBe(false);

    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("No record found for 'rec_missing'") as string })
    );
  });

  it('should throw AppError for unexpected status', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: httpStatusCodes.BAD_REQUEST,
      data: [],
    });

    await expect(catalogCall.findRecord('rec_error')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Catalog returned unexpected status') as string })
    );
  });

  it('should throw AppError if axios rejects', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    await expect(catalogCall.findRecord('rec_fail')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Error occurred during findRecord call') as string })
    );
  });

  it('should throw AppError when record is found but not published', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: httpStatusCodes.OK,
      data: [{ id: '123', name: 'rec_unpublished', productStatus: 'unpublished' }],
    });

    await expect(catalogCall.findRecord('rec_unpublished')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("Record 'rec_unpublished' found but not published") as string })
    );
  });
});
