// TODO: remove this file
import { IExtractableRecord, IAuthPayloadWithRecord } from '@common/constants';

export const recordInstance: IExtractableRecord = {
  id: 101,
  recordName: 'rec_name',
  authorizedBy: 'username',
  authorizedAt: '2026-01-16T12:00:00Z',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};

// mock valid credentials
export const validCredentials: IAuthPayloadWithRecord = {
  username: 'username',
  password: 'password',
  recordName: recordInstance.recordName,
};

export const invalidCredentials: IAuthPayloadWithRecord = {
  username: 'wrong',
  password: 'wrong',
  recordName: 'rec_invalid',
};
