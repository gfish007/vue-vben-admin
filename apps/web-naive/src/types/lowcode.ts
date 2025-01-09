/** 页面类型 */
export type PageType = 'DETAIL' | 'FORM' | 'LIST';

/** 组件类型 */
export type ComponentType = 'ACTION' | 'CONTAINER' | 'DISPLAY' | 'FORM';

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
  dataSources?: DataSource[];
}

/** 属性面板标签页配置 */
export interface PropPanelTab {
  name: string;
  label: string;
  fields: string[];
}

/** 组件类别 */
export type ComponentCategory =
  | 'business'
  | 'data'
  | 'feedback'
  | 'form'
  | 'layout';

/** 属性类型 */
export type PropType =
  | 'array'
  | 'boolean'
  | 'enum'
  | 'number'
  | 'object'
  | 'string';

/** 属性配置 */
export interface PropSchema {
  defaultValue?: any;
  label: string;
  max?: number;
  min?: number;
  options?: Array<{ label: string; value: any }>;
  type: 'checkbox' | 'input' | 'number' | 'radio' | 'select' | 'switch';
}

export interface ComponentDefinition {
  category: 'display' | 'feedback' | 'form' | 'layout';
  componentCode: string;
  componentName: string;
  defaultProps: Record<string, any>;
  defaultStyle?: Partial<CSSStyleDeclaration>;
  group: 'basic' | 'business';
  icon: string;
  propsSchema: Record<string, PropSchema>;
}

/** 组件实例 */
export interface ComponentInstance {
  componentCode: string;
  componentInstanceId: string;
  componentName: string;
  props: Record<string, any>;
  propsSchema: Record<string, PropSchema>;
  style: Partial<CSSStyleDeclaration>;
  children?: ComponentInstance[];
  parentId?: string;
  hasCustomPropertyPanel?: boolean;
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

/** 组件样式 */
export interface ComponentStyle {
  position?: 'absolute' | 'relative';
  top?: string;
  left?: string;
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  background?: string;
  zIndex?: number;
  [key: string]: any;
}

/** 事件API配置 */
export interface EventApiConfig {
  url: string;
  method: string;
  params: Record<string, any>;
  dataHandler: string;
}

/** 事件配置 */
export interface EventConfig {
  type: 'api' | 'function';
  api?: EventApiConfig;
  function?: string;
}

/** 数据源类型 */
export type DataSourceType = 'API' | 'DATABASE' | 'STATIC';

/** 数据源状态 */
export type DataSourceStatus = 0 | 1;

/** 请求方法 */
export type HttpMethod = 'DELETE' | 'GET' | 'POST' | 'PUT';

/** API数据源配置 */
export interface ApiDataSourceConfig {
  type: 'API';
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
}

/** 数据库数据源配置 */
export interface DatabaseDataSourceConfig {
  type: 'DATABASE';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sql: string;
}

/** 静态数据源配置 */
export interface StaticDataSourceConfig {
  type: 'STATIC';
  data: any;
}

/** 数据源配置 */
export type DataSourceConfig =
  | ApiDataSourceConfig
  | DatabaseDataSourceConfig
  | StaticDataSourceConfig;

/** 数据源定义 */
export interface DataSource {
  id: string;
  tenantId?: string;
  dsCode: string;
  dsName: string;
  dsType: DataSourceType;
  config: DataSourceConfig;
  remark?: string;
  status: DataSourceStatus;
  variables?: Record<string, any>;
}
