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

/** 属性面板标签页配置 */
export interface PropPanelTab {
  name: string;
  label: string;
  fields: string[];
}

/** 组件定义 */
export interface Component {
  id?: number;
  tenantId?: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  category: string;
  icon?: string;
  isContainer: boolean;
  fullWidth?: boolean;
  // 属性编辑配置，优先使用 propEditor，如果不存在则使用 propsSchema 和 propPanelTabs
  propEditor?: {
    component: any;  // Vue 组件
    props?: Record<string, any>;  // 组件属性
  };  // 自定义属性编辑器组件
  propsSchema?: Record<string, PropSchema>;  // 默认属性配置
  propPanelTabs?: PropPanelTab[];  // 默认面板配置
  defaultProps: Record<string, any>;
  status: 0 | 1;
  render?: any;
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
  componentName: string;
  props: Record<string, any>;
  sortOrder: number;
  children?: ComponentRelation[];
}

/** 属性类型 */
export type PropType = 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'upload';

/** 属性配置 */
export interface PropSchema {
  type: PropType;
  label: string;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
  showOn?: {
    [key: string]: string | string[];
  };
  items?: PropSchema;  // 用于数组类型
  properties?: Record<string, PropSchema>;  // 用于对象类型
  accept?: string;  // 用于上传类型
  maxSize?: number;  // 用于上传类型
} 
