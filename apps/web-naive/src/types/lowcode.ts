/** 页面类型 */
export type PageType = 'FORM' | 'LIST' | 'DETAIL';

/** 组件类型 */
export type ComponentType = 'CONTAINER' | 'FORM' | 'DISPLAY' | 'ACTION';

/** 基础响应类型 */
export interface BaseResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/** 分页请求参数 */
export interface PageParams {
  page: number;
  pageSize: number;
}

/** 分页响应数据 */
export interface PageResult<T> {
  items: T[];
  total: number;
}

/** 页面配置 */
export interface PageConfig {
  id: number;
  tenantId: string;
  pageCode: string;
  pageName: string;
  pageType: PageType;
  layoutConfig: Record<string, any>;
  remark?: string;
  status: 0 | 1;
  gmtCreate: string;
  gmtModified: string;
}

/** 组件定义 */
export interface Component {
  id: number;
  tenantId: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  category: string;
  icon?: string;
  isContainer: boolean;
  propsSchema: Record<string, any>;
  defaultProps: Record<string, any>;
  remark?: string;
  status: 0 | 1;
}

/** 组件关系 */
export interface ComponentRelation {
  id: number;
  tenantId: string;
  pageCode: string;
  version: string;
  componentInstanceId: string;
  parentInstanceId?: string;
  componentCode: string;
  props: Record<string, any>;
  sortOrder: number;
} 
