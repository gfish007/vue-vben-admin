export namespace RecommendDetailApi {
  /** 推荐详情记录 */
  export interface RecommendDetailRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    recommendId: string;
    targetType: string;
    relationId: string;
    sortOrder: number;
    title: string;
  }

  /** 保存请求 */
  export interface RecommendDetailSaveReq {
    id?: string;
    recommendId: string;
    targetType: string;
    relationId: string;
    sortOrder: number;
    title: string;
  }

  /** 查询结果 */
  export interface QueryResult {
    records: RecommendDetailRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }
}