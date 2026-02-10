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
  '/audit/{recordName}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get all audit logs by record name */
    get: operations['getAudit'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/validate': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Validate a user's username and password */
    post: operations['validateUser'];
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
    validateResponse: {
      isValid: boolean;
      message: string;
      /** @enum {string} */
      code: 'SUCCESS' | 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'INVALID_RECORD_NAME' | 'INTERNAL_ERROR';
    };
    'auth-payload': {
      username: string;
      password: string;
    };
    'auth-payload-with-record': {
      username: string;
      password: string;
      recordName: string;
    };
    'extractable-record': {
      /** Format: int64 */
      id: number;
      recordName: string;
      username?: string;
      authorizedBy: string;
      authorizedAt?: string;
      /** @description Metadata stored in extractable_records.data */
      data?: {
        [key: string]: unknown;
      };
    };
    'audit-log': {
      /** Format: int64 */
      id: number;
      recordName: string;
      username?: string;
      authorizedBy: string;
      /** @enum {string} */
      action: 'CREATE' | 'DELETE';
      authorizedAt?: string;
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
      /** @description Bad request */
      400: {
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
          'application/json': components['schemas']['validateResponse'];
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
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
        'application/json': {
          username: string;
          password: string;
          /** @description User authorizing this record creation */
          authorizedBy: string;
          /** @description Optional metadata for the record */
          data?: {
            [key: string]: unknown;
          };
        };
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
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Internal server error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
        'application/json': {
          username: string;
          password: string;
          /** @description User authorizing this deletion */
          authorizedBy: string;
        };
      };
    };
    responses: {
      /** @description Record deleted successfully */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Validation failed – deletion not allowed */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Record not found */
      404: {
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
          'application/json': components['schemas']['validateResponse'];
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
        'application/json': components['schemas']['auth-payload-with-record'] & {
          /**
           * @description When true, performs remote (multi-site) validation. When false or omitted, validation is performed only on local site.
           * @default true
           */
          multiSiteValidation?: boolean;
        };
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
      /** @description Validation failed – missing fields */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Validation error – already exists */
      404: {
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
          'application/json': components['schemas']['validateResponse'];
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
        'application/json': components['schemas']['auth-payload-with-record'];
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
      /** @description Validation failed – missing fields */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
      /** @description Validation error – doesn't exists */
      404: {
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
          'application/json': components['schemas']['validateResponse'];
        };
      };
    };
  };
  getAudit: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description The recordName to fetch audit logs for */
        recordName: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of audit logs for the record (empty array if none found) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['audit-log'][];
        };
      };
      /** @description Invalid recordName or request parameters */
      400: {
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
          'application/json': components['schemas']['validateResponse'];
        };
      };
    };
  };
  validateUser: {
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
      /** @description User credentials are valid */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
        };
      };
      /** @description Missing username or password */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['validateResponse'];
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
          'application/json': components['schemas']['validateResponse'];
        };
      };
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
