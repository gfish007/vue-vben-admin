export namespace ServerApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      auditStatus?: string;
      publishStatus?: string;
      regionId?: string;
    };
    regionId?: string; // 添加regionId参数
  }

  export interface ServerRecord {
    id: number;
    gmtCreate: string;
    gmtModified: string;
    userName: string;
    userId: number;
    regionId: number;
    regionName: string;
    title: string;
    connectInfo: string;
    content: string;
    tags: string[];
    publishStatus: string;
    auditStatus: string;
    extendContent: string;
    coverUrl: string;
    sortNo: number;
    rejectReason?: string;
  }

  export interface ServerSaveReq {
    id?: number;
    regionId: number;
    regionName: string;
    title: string;
    connectInfo: string;
    content: string;
    tags: string[];
    coverUrl: string;
    sortNo: number;
  }

  export interface QueryResult {
    records: ServerRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}