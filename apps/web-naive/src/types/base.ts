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

/** 基础响应接口 */
export interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

/** 基础分页结果接口 */
export interface BasePageResult<T = any> {
  current: number;
  records: T[];
  size: number;
  total: number;
}
