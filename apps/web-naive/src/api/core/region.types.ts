export namespace RegionApi {
  /** 查询参数 */
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      country?: string;
      enable_status?: null | number;
      level?: null | string;
      ncity?: string;
      ndistrict?: string;
      nprovince?: string;
      nstreet?: string;
      title?: string;
    };
  }

  /** 区域记录 */
  export interface RegionRecord {
    id: number;
    title: string;
    coverUrl: string;
    description: string;
    extendContent: Array<{ key: string; value: string }>;
    location: string;
    locationId: number;
    locationInfo: Record<string, any>;
    enable_status: number;
    level: 'city' | 'country' | 'district' | 'province' | 'street';
  }

  /** 查询结果 */
  export interface QueryResult {
    records: RegionRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }

  export interface RegionSaveReq {
    id?: number;
    title: string;
    coverUrl: string;
    description: string;
    extendContent: Array<{ key: string; value: string }>;
    location: string;
    locationId: number;
    locationInfo: Record<string, any>;
    level: 'city' | 'country' | 'district' | 'province' | 'street';
    // ... any other fields ...
  }
}
