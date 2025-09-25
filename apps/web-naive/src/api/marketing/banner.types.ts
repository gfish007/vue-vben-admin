export namespace BannerApi {
  export interface BannerRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    title: string;
    imageUrl: string;
    jumpType: number;
    jumpUrl: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
    status: number;
  }

  export interface BannerSaveReq {
    id?: string;
    title: string;
    imageUrl: string;
    jumpType: number;
    jumpUrl: string;
    startTime: string | null;
    endTime: string | null;
    sortOrder: number;
    status?: number;
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
    };
  }

  export interface QueryResult {
    records: BannerRecord[];
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