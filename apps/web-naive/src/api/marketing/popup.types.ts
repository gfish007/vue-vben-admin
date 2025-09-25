export namespace PopupApi {
  export interface PopupRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    title: string;
    content: string;
    imageUrl: string;
    jumpType: number;
    jumpUrl: string;
    startTime: string;
    endTime: string;
    priority: number;
    status: number;
    showFrequency: number;
    targetUsers: string;
    platform: string;
  }

  export interface PopupSaveReq {
    id?: string;
    title: string;
    content: string;
    imageUrl: string;
    jumpType: number;
    jumpUrl: string;
    startTime: string | null;
    endTime: string | null;
    priority: number;
    status?: number;
    showFrequency: number;
    targetUsers: string;
    platform: string;
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
    records: PopupRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }

  export interface StatusReq {
    id: string;
    status: number;
  }

  export interface DeleteReq {
    ids: string[];
  }
}