import { trace } from '@opentelemetry/api';
import mockAxios from 'jest-mock-axios';
import { StatusCodes } from 'http-status-codes';
import { RecordStatus } from '@map-colonies/mc-model-types';
import type { IConfig } from '@src/common/interfaces';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';
import { AppError } from '@src/utils/appError';
import { createLoggerMock } from '@tests/mocks/integrationMocks';

// ensure modules that import 'axios' get the jest-mock-axios instance
// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
jest.mock('axios', () => require('@tests/mocks/axios').default);

describe('CatalogCall Integration (axios mocked)', () => {
  let catalogCall: CatalogCall;
  const loggerMock = createLoggerMock();
  const configMock = {
    get: jest.fn().mockReturnValue('http://mock-catalog-service'),
  } as unknown as jest.Mocked<IConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    catalogCall = new CatalogCall(configMock, loggerMock, trace.getTracer('testTracer'));
  });

  it('should throw AppError for axios rejection', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

    await expect(catalogCall.findPublishedRecord('rec_fail')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Error occurred during findPublishedRecord call') as string })
    );
  });

  it('should throw AppError for unexpected status', async () => {
    mockAxios.post.mockResolvedValueOnce({
      status: StatusCodes.BAD_REQUEST,
      data: [],
    });

    await expect(catalogCall.findPublishedRecord('rec_error')).rejects.toThrow(AppError);

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining('Error occurred during findPublishedRecord call') as string })
    );
  });

  it('should return false when record exists but not published', async () => {
    mockAxios.post.mockResolvedValueOnce({
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
    mockAxios.post.mockResolvedValueOnce({
      status: StatusCodes.OK,
      data: [{ id: '123', name: 'rec_published', productStatus: RecordStatus.PUBLISHED }],
    });

    const result = await catalogCall.findPublishedRecord('rec_published');

    expect(result).toBe(true);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: expect.stringContaining("Record 'rec_published' found and published") as string })
    );
  });

  it('should return false when no records are found', async () => {
    mockAxios.post.mockResolvedValueOnce({
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
