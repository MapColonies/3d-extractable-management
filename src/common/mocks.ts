import { IExtractableRecord } from '@common/constants';

/* eslint-disable @typescript-eslint/naming-convention */
export const recordInstance: IExtractableRecord = {
  id: 101,
  site_id: 5001,
  record_name: 'rec_3DModel_001',
  credentials: 'alice_admin',
  extractable: true,
  created_at: '2026-01-16T12:00:00Z',
  updated_at: '2026-01-16T12:10:00Z',
  data: {
    productType: '3DPhotoRealistic' as never,
    resolution: '4K' as never,
    source: 'drone_scan' as never,
  },
};
