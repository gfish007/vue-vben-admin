export namespace SvcApi {
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      auditStatus?: string;
      publishStatus?: string;
      regionId?: string;
    } 
    regionId?: string; // 添加regionId参数
  }

  export interface SvcRecord {
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
    svcType: number; // 0: 正常 1: 预约 2: 票据
    rejectReason?: string;
    location?: string;
    locationInfo?: Record<string, any>;
    imageList?: Array<{ 
      fileName: string; 
      fileUrl: string; 
      videoFlag: boolean; 
      height: number | null; 
      width: number | null; 
    }>;
  }

  export interface SvcSaveReq {
    id?: number;
    regionId: number;
    regionName: string;
    title: string;
    connectInfo: string;
    content: string;
    tags: string[];
    coverUrl: string;
    sortNo: number;
    svcType: number; // 0: 正常 1: 预约 2: 票据
    location?: string;
    locationInfo?: Record<string, any>;
    imageList?: Array<{ 
      fileName: string; 
      fileUrl: string; 
      videoFlag: boolean; 
      height: number | null; 
      width: number | null; 
    }>;
  }

  export interface QueryResult {
    records: SvcRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}