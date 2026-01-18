import { IExtractableRecord, IAuthPayload } from '@common/constants';

/* eslint-disable @typescript-eslint/naming-convention */
export const recordInstance: IExtractableRecord = {
  id: 101,
  record_name: 'rec_3DModel_001',
  username: 'username',
  created_at: '2026-01-16T12:00:00Z',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};

export const credentialsInstance: IAuthPayload = {
  username: 'username',
  password: 'password',
};
