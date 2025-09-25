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

  /** 禁用区域 */
  export interface DisableRegion {
    northeast: {
      lat: number;
      lng: number;
    };
    southwest: {
      lat: number;
      lng: number;
    };
  }

  /** 区域记录 */
  export interface RegionRecord {
    id: number;
    title: string;
    coverUrl: string;
    description: string;
    history: string; // 新增历史百科字段
    extendContent: Array<{ key: string; value: string }>;
    location: string;
    locationId: number;
    locationInfo: Record<string, any>;
    disableRegion?: DisableRegion | null; // 添加禁用区域字段
    pid?: number; // 父ID字段
    enable_status: number;
    level: 'city' | 'country' | 'district' | 'province' | 'street' | 'village';
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
    history: string; // 新增历史百科字段
    extendContent: Array<{ key: string; value: string }>;
    location: string;
    locationId: number;
    locationInfo: Record<string, any>;
    disableRegion?: DisableRegion | null; // 添加禁用区域字段
    pid?: number; // 父ID字段
    level: 'city' | 'country' | 'district' | 'province' | 'street'| 'village';
    // ... any other fields ...
  }
}
