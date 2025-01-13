import type { Page } from '../../types/lowcode';

export namespace PageApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      pageCode?: string;
      pageName?: string;
    };
  }

  export interface QueryResult extends Page {
    id: string;
    tenantId?: string;
    status: PageStatus;
    version: string;
    remark?: string;
  }
}

export enum PageStatus {
  DISABLED = 'DISABLED',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}
