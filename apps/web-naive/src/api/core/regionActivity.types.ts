export namespace RegionActivityApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      auditStatus?: string;
      gmtEnd?: string;
      gmtStart?: string;
      publishStatus?: string;
      regionId?: string;
    };
  }

  export interface RegionActivityRecord {
    id: number;
    gmtCreate: string;
    gmtModified: string;
    userName: string;
    userId: number;
    regionId: number;
    regionName: string;
    title: string;
    connectInfo: string;
    gmtStart: string;
    gmtEnd: string;
    content: string;
    tags: string[];
    publishStatus: string;
    auditStatus: string;
    extendContent: string;
    coverUrl: string;
    sortNo: number;
    rejectReason?: string;
  }

  export interface RegionActivitySaveReq {
    id?: number;
    regionId: number;
    regionName: string;
    title: string;
    connectInfo: string;
    gmtStart: string;
    gmtEnd: string;
    content: string;
    tags: string[];
    coverUrl: string;
    sortNo: number;
  }

  export interface QueryResult {
    records: RegionActivityRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}
