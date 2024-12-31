export namespace LiveAccountApi {
  export interface LiveAccountRecord {
    id: null | number;
    accountName: string;
    uid: string;
    department: string;
    channel: string;
    shopName: string;
    gmtCreate?: string;
    gmtModified?: string;
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      accountName?: string;
      channel?: string;
      shopName?: string;
    };
  }

  export interface QueryResult {
    records: LiveAccountRecord[];
    total: number;
    size: number;
    current: number;
  }
}
