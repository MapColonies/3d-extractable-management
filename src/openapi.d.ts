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
    /** Get all extractable records */
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
    /** Get extractable record by record name */
    get: operations['getRecord'];
    put?: never;
    /** Create extractable record */
    post: operations['createRecord'];
    /** Delete extractable record */
    delete: operations['deleteRecord'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/records/validateCreate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Validate record can be created */
    post: operations['validateCreate'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/records/validateDelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Validate record can be deleted */
    post: operations['validateDelete'];
    delete?: never;
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
      /** @example Unauthorized – invalid username or password */
      message: string;
    };
    job: {
      /** @enum {string} */
      status: 'Success' | 'Failed';
    };
    validateResponse: {
      /** @example true */
      isValid: boolean;
      /** @example Record can be created or deleted */
      message?: string;
      /** @enum {string} */
      code?: 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'INVALID_RECORD_NAME';
    };
    'auth-payload': {
      /** @example john_doe */
      username: string;
      /** @example secret123 */
      password: string;
    };
    'extractable-record': {
      /** @example sdfsdfv3f3f3fwfcf23f */
      id: string;
      /** @example rec_A */
      recordName: string;
      /** @example john_doe */
      username: string;
      /**
       * Format: date-time
       * @example 2026-01-16T12:00:00Z
       */
      created_at: string;
      /**
       * @description Metadata stored in extractable_records.data
       * @example {
       *       "productType": "3DPhotoRealistic"
       *     }
       */
      data?: Record<string, never>;
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
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of extractable records (empty array if none found) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['extractable-record'][];
        };
      };
      /** @description Unexpected server error */
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
      header?: never;
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
      /** @description Unexpected server error */
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
      header?: never;
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['auth-payload'];
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
      /** @description Validation failed – call POST /records/validate first */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unauthorized – invalid username or password */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Record not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Unexpected server error */
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
      header?: never;
      path: {
        recordName: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['auth-payload'];
      };
    };
    responses: {
      /** @description Record deleted successfully (idempotent) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['job'];
        };
      };
      /** @description Validation failed – deletion not allowed */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Unexpected server error */
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
  validateCreate: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['auth-payload'];
      };
    };
    responses: {
      /** @description Validation result for create */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Unauthorized – invalid credentials */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Internal server error */
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
  validateDelete: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['auth-payload'];
      };
    };
    responses: {
      /** @description Validation result for delete */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Unauthorized – invalid credentials */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Internal server error */
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
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
