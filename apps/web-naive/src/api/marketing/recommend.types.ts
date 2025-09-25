export namespace RecommendApi {
  /** 查询参数 */
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

  /** 推荐记录 */
  export interface RecommendRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    targetType: string;
    targetId: number;
    sortOrder: number;
    status: number;
    regionId: number;
    regionName: string;
    title: string;
  }

  /** 保存请求 */
  export interface RecommendSaveReq {
    id?: string;
    targetType: string;
    targetId: number;
    sortOrder: number;
    status?: number;
    regionId: number;
    regionName: string;
    title: string;
  }

  /** 状态更新请求 */
  export interface StatusReq {
    id: string;
    status: number;
  }

  /** 查询结果 */
  export interface QueryResult {
    records: RecommendRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}