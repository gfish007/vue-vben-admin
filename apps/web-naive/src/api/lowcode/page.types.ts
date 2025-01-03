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
    id?: number;
    /** 租户ID */
    tenantId?: string;
    /** 页面编码 */
    pageCode: string;
    /** 页面名称 */
    pageName: string;
    /** 页面类型 */
    pageType: 'FORM' | 'LIST' | 'DETAIL';
    /** 布局配置 */
    layoutConfig?: Record<string, any>;
    /** 备注 */
    remark?: string;
    /** 状态 0-禁用 1-启用 */
    status: 0 | 1;
    /** 创建时间 */
    gmtCreate?: string;
    /** 修改时间 */
    gmtModified?: string;
  }
} 
