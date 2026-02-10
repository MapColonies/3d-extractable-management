import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { RecordStatus } from '@map-colonies/mc-model-types';
import type { IConfig } from '@src/common/interfaces';
import { CatalogCall } from '@src/externalServices/catalog/catalogCall';
import { AppError } from '@src/utils/appError';
import { createTracerMock, createLoggerMock } from '@tests/mocks/integrationMocks';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CatalogCall Integration (axios mocked)', () => {
  let catalogCall: CatalogCall;
  const loggerMock = createLoggerMock();
  const tracerMock = createTracerMock();
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
      data: [{ id: '123', name: 'rec_published', productStatus: RecordStatus.PUBLISHED }],
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
