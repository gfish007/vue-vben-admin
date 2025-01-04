import type { ComponentRelation } from '#/types/lowcode';

export namespace PageApi {
  /** 查询参数 */
  export interface QueryParams {
    /** 分页参数 */
    page: {
      /** 当前页码 */
      current: number;
      /** 每页条数 */
      size: number;
    };
    /** 查询条件 */
    queryBody: {
      /** 页面编码 */
      pageCode?: string;
      /** 页面名称 */
      pageName?: string;
      /** 页面类型 */
      pageType?: string;
    };
  }

  /** 查询结果 */
  export interface QueryResult {
    /** 总条数 */
    total: number;
    /** 当前页数据 */
    records: PageRecord[];
  }

  /** 页面记录 */
  export interface PageRecord {
    /** 主键ID */
    id: number;
    /** 租户ID */
    tenantId: string;
    /** 页面编码 */
    pageCode: string;
    /** 页面名称 */
    pageName: string;
    /** 页面类型 */
    pageType: string;
    /** 状态 0-禁用 1-启用 */
    status: number;
    /** 版本 */
    version: string;
    /** 组件关系 */
    componentRelations: ComponentRelation[];
    /** 创建人 */
    createdBy: string;
    /** 创建时间 */
    createdTime: string;
    /** 更新人 */
    updatedBy: string;
    /** 更新时间 */
    updatedTime: string;
  }
} 
