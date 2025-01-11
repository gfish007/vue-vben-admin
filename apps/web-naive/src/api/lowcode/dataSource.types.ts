import type { DataSource } from '../../types/lowcode';

export namespace DataSourceApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      dsCode?: string;
      dsName?: string;
    };
  }

  export interface QueryResult extends DataSource {
    createTime: string;
    updateTime: string;
  }
}
