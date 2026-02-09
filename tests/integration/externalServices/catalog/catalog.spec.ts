import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import type { Tracer, Span, SpanOptions, Context } from '@opentelemetry/api';
import type { Logger } from '@map-colonies/js-logger';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';
import { AppError } from '@src/utils/appError';
import { IConfig } from '@src/common/interfaces';

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
  const loggerMock = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  } as unknown as Logger;
  const configMock = {
    get: jest.fn().mockReturnValue('http://mock-catalog-service'),
  } as unknown as jest.Mocked<IConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    catalogCall = new CatalogCall(configMock, loggerMock, tracerMock);
  });

  it('should throw AppError for axios rejection', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    await expect(catalogCall.findPublishedRecord('rec_fail')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Error occurred during findPublishedRecord call') as string })
    );
  });

  it('should throw AppError for unexpected status', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: StatusCodes.BAD_REQUEST,
      data: [],
    });

    await expect(catalogCall.findPublishedRecord('rec_error')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Error occurred during findPublishedRecord call') as string })
    );
  });

  it('should return false when record exists but not published', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: StatusCodes.OK,
      data: [{ id: '123', name: 'rec_unpublished', productStatus: 'draft' }],
    });

    const result = await catalogCall.findPublishedRecord('rec_unpublished');

    expect(result).toBe(false);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("Record 'rec_unpublished' found but not published") as string })
    );
  });

  it('should return true when record exists and is published', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: StatusCodes.OK,
      data: [{ id: '123', name: 'rec_published', productStatus: 'published' }],
    });

    const result = await catalogCall.findPublishedRecord('rec_published');

    expect(result).toBe(true);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("Record 'rec_published' found and published") as string })
    );
  });

  it('should return false when no records are found', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: StatusCodes.OK,
      data: [],
    });

    const result = await catalogCall.findPublishedRecord('rec_missing');

    expect(result).toBe(false);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("No record found for 'rec_missing'") as string })
    );
  });
});
