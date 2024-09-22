export namespace AttractionApi {
  /** 查询参数 */
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      enableStatus?: boolean;
      publishStatus?: 'PENDING' | 'PUBLISH';
      regionId?: number;
      title?: string;
    };
  }

  /** 景点记录 */
  export interface AttractionRecord {
    id: number;
    regionId: number;
    regionName: string;
    locationInfo: {
      [key: string]: any;
      lnglat: string;
    };
    location: string;
    title: string;
    description: string;
    extendContent: Record<string, any>;
    coverList: string[];
    publishStatus: 'PENDING' | 'PUBLISH';
    enableStatus: boolean;
  }

  /** 查询结果 */
  export interface QueryResult {
    records: AttractionRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }

  /** 保存请求 */
  export interface AttractionSaveReq {
    id?: number;
    regionId: number;
    locationInfo: {
      [key: string]: any;
      lnglat: string;
    };
    title: string;
    location: string;
    extendContent: Record<string, any>;
    coverList: string[];
    description: string;
    publishStatus?: 'PENDING' | 'PUBLISH';
    enableStatus?: boolean;
  }
}
