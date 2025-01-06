import type { BasePageParams } from '../../types/base';
import type { DataSource } from '../../types/lowcode';

export namespace DataSourceApi {
  export interface QueryParams extends BasePageParams {
    queryBody: {
      dsCode?: string;
      dsName?: string;
    };
  }

  export type QueryResult = DataSource;
}
