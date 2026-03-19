import { Layer3DMetadata } from '@map-colonies/mc-model-types';
import { IPaginationResponse } from '@src/common/interfaces';

export interface MetadataParams {
  identifier: string;
}

export interface Record3D extends Layer3DMetadata {
  id: string;
  links: string;
}

export interface IFindPublishedRecordsPayload {
  productName: string;
}

export interface CSWRecord {
  productName: string;
  productId: string;
}

export type CSWResponse = Omit<IPaginationResponse<CSWRecord>, 'numberOfRecords' | 'numberOfRecordsReturned'>;
