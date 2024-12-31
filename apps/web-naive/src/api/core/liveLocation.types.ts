export namespace LiveLocationApi {
  export interface LiveLocationRecord {
    id: null | number;
    gmtCreate?: string;
    gmtModified?: string;
    roomName: string;
    remark: string;
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      roomName?: string;
    };
  }

  export interface QueryResult {
    records: LiveLocationRecord[];
    total: number;
    size: number;
    current: number;
  }
}
