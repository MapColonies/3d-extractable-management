/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/records': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get all extractable records for a site */
    get: operations['getRecords'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/records/{recordName}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get extractable record by recordName */
    get: operations['getRecord'];
    put?: never;
    /** Create record as extractable */
    post: operations['createRecord'];
    /** Delete extractable record */
    delete: operations['deleteRecord'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/records/validate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Validate record can be created */
    post: operations['validateCreateRecord'];
    /** Validate record can be deleted */
    delete: operations['validateDeleteRecord'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    error: {
      message: string;
    };
    job: {
      /** @enum {string} */
      status: 'Success' | 'Failed';
    };
    'basic-payload': {
      /** @example john_doe */
      credentials: string;
      /** @example true */
      extractable: boolean;
      /**
       * @example {
       *       "productType": "3DPhotoRealistic"
       *     }
       */
      data?: {
        [key: string]: unknown;
      };
    };
    'extractable-record': {
      /** @example 1 */
      id: number;
      /** @example 100 */
      site_id: number;
      /** @example rec_A */
      record_name: string;
      /** @example john_doe */
      credentials: string;
      /** @example true */
      extractable: boolean;
      /**
       * Format: date-time
       * @example 2026-01-16T12:00:00Z
       */
      created_at: string;
      /**
       * Format: date-time
       * @example 2026-01-16T12:10:00Z
       */
      updated_at: string;
      /**
       * @description Metadata stored in extractable_records.data
       * @example {
       *       "productType": "3DPhotoRealistic"
       *     }
       */
      data?: Record<string, never>;
    };
    'audit-record': {
      id: number;
      site_id: number;
      record_name: string;
      credentials: string;
      /** @enum {string} */
      action: 'CREATE' | 'CREATE_VALIDATE' | 'DELETE' | 'DELETE_VALIDATE';
      /** Format: date-time */
      created_at: string;
      data?: {
        [key: string]: unknown;
      };
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getRecords: {
    parameters: {
      query?: never;
      header: {
        /** @description Site / tenant ID */
        'X-Site-Id': number;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of extractable records */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['extractable-record'][];
        };
      };
      /** @description Bad request */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unexpected error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  getRecord: {
    parameters: {
      query?: never;
      header: {
        'X-Site-Id': number;
      };
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Record found */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['extractable-record'];
        };
      };
      /** @description Record not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unexpected error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  createRecord: {
    parameters: {
      query?: never;
      header: {
        'X-Site-Id': number;
      };
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['basic-payload'];
      };
    };
    responses: {
      /** @description Record created successfully */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['extractable-record'];
        };
      };
      /** @description Validation failed (call /records/validate first) */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unexpected error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  deleteRecord: {
    parameters: {
      query?: never;
      header: {
        'X-Site-Id': number;
      };
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Record deleted (idempotent) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['job'];
        };
      };
      /** @description Validation failed (call /records/validateDelete first) */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unexpected error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  validateCreateRecord: {
    parameters: {
      query?: never;
      header: {
        'X-Site-Id': number;
      };
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['basic-payload'];
      };
    };
    responses: {
      /** @description Record is valid to create */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['job'];
        };
      };
      /** @description Validation failed */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  validateDeleteRecord: {
    parameters: {
      query?: never;
      header: {
        'X-Site-Id': number;
      };
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Record can be deleted */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['job'];
        };
      };
      /** @description Validation failed */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
