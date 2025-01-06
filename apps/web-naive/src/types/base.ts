/** 基础分页请求参数 */
export interface BasePageParams {
  page: {
    current: number;
    size: number;
  };
  queryBody: Record<string, any>;
}

/** 基础分页响应结果 */
export interface BasePageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}
