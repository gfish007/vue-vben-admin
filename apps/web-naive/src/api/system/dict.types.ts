export namespace DictApi {
  /** 查询参数 */
  export interface QueryParams {
    page: {
      current: number;
      size: number;
    };
    queryBody: {
      groupKey?: string;
      dictKey?: string;
    };
  }

  /** 字典记录 */
  export interface DictRecord {
    id: string;
    gmtCreate: string;
    gmtModified: string;
    dictKey: string;
    dictValue: string;
    groupKey: string;
    groupDesc: string;
  }

  /** 字典保存请求 */
  export interface DictSaveReq {
    id?: string;
    dictKey: string;
    dictValue: string;
    groupKey: string;
    groupDesc: string;
  }
}