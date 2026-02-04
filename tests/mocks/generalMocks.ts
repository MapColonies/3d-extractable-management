import { IExtractableRecord, IAuthPayloadWithRecord } from '@common/constants';

export const recordInstance: IExtractableRecord = {
  id: 101,
  record_name: 'rec_name',
  authorized_by: 'username',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};

export const validCredentials: IAuthPayloadWithRecord = {
  username: 'username',
  password: 'password',
  record_name: recordInstance.record_name,
};

export const invalidCredentials: IAuthPayloadWithRecord = {
  username: 'wrong',
  password: 'wrong',
  record_name: 'rec_invalid',
};
