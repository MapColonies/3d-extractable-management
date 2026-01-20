import { IExtractableRecord, IAuthPayload } from '@common/constants';

/* eslint-disable @typescript-eslint/naming-convention */
export const recordInstance: IExtractableRecord = {
  id: 'a101',
  recordName: 'rec_name',
  username: 'username',
  created_at: '2026-01-16T12:00:00Z',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};

// mock valid credentials
export const validCredentials: IAuthPayload = {
  username: 'username',
  password: 'password',
};

export const invalidCredentials: IAuthPayload = {
  username: 'wrong',
  password: 'wrong',
};
