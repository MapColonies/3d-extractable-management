import { IExtractableRecord, IAuthPayloadWithRecord } from '@common/constants';

export const recordInstance: IExtractableRecord = {
  id: 101,
  recordName: 'rec_name',
  authorizedBy: 'username',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};

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
