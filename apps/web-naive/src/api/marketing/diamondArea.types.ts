export namespace DiamondAreaApi {
  export interface DiamondAreaRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    title: string;
    iconUrl: string;
    jumpType: number;
    jumpUrl: string;
    sortOrder: number;
    status: number;
    startTime: string;
    endTime: string;
    showType: number; // 1：背景图 2：icon图标 3：远程icon图标
    regionId?: number; // 区域ID
  }

  export interface DiamondAreaSaveReq {
    id?: string;
    title: string;
    iconUrl: string;
    jumpType: number;
    jumpUrl: string;
    sortOrder: number;
    startTime: string | null;
    endTime: string | null;
    status: number;
    showType: number; // 1：背景图 2：icon图标 3：远程icon图标
    regionId?: number; // 区域ID
  }

  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      title?: string;
      startTimeBegin?: string;
      startTimeEnd?: string;
      status?: number;
      regionId?: number; // 区域ID
    };
  }

  export interface QueryResult {
    records: DiamondAreaRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }

  export interface StatusReq {
    id: string;
    status: number;
  }
}