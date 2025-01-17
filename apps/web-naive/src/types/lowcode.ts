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

/** 属性面板标签页类型 */
export type PropertyPanelTabType =
  | 'advanced'
  | 'data'
  | 'event'
  | 'props'
  | 'style';

/** 属性面板配置 */
export interface PropertyPanelConfig {
  /** 启用的标签页 */
  enabledTabs: PropertyPanelTabType[];
  /** 自定义属性面板组件 */
  customPanels?: {
    advanced?: string;
    data?: string;
    event?: string;
    props?: string;
    style?: string;
  };
}

/** 组件定义 */
export interface ComponentDefinition {
  category: 'display' | 'feedback' | 'form' | 'layout';
  componentCode: string;
  componentName: string;
  defaultProps: Record<string, any>;
  defaultStyle?: Partial<CSSStyleDeclaration>;
  group: 'basic' | 'business';
  icon: string;
  propsSchema: Record<string, PropSchema>;
  /** 属性面板配置 */
  propertyPanel: PropertyPanelConfig;
}

/** 组件实例 */
export interface ComponentInstance {
  componentInstanceId: string;
  componentCode: string;
  props: Record<string, any>;
  style: Record<string, any>;
  dataBinding: {
    dsCode: string;
    path: string;
  } | null;
  events: null | Record<string, any>;
  children?: ComponentInstance[];
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

/** 事件动作类型 */
export type ActionType = 'function' | 'loadData' | 'message';

/** 事件动作基础接口 */
export interface BaseAction {
  type: ActionType;
}

/** 加载数据动作 */
export interface LoadDataAction extends BaseAction {
  type: 'loadData';
  target: string; // 目标数据源编码
  params?: Record<string, any>; // 请求参数
  success?: Action[]; // 成功后的动作
  error?: Action[]; // 失败后的动作
  handler?: string; // 数据处理函数
}

/** 消息提示动作 */
export interface MessageAction extends BaseAction {
  type: 'message';
  content: string;
  messageType?: 'error' | 'info' | 'success' | 'warning';
}

/** 自定义函数动作 */
export interface FunctionAction extends BaseAction {
  type: 'function';
  handler: string; // 函数体
  dependencies?: string[]; // 依赖的数据源
}

/** 事件动作联合类型 */
export type Action = FunctionAction | LoadDataAction | MessageAction;

/** 事件配置 */
export interface EventConfig {
  type: string; // 事件类型
  actions: Action[]; // 事件动作列表
}

/** 数据源类型 */
export type DataSourceType = 'API' | 'DATABASE' | 'STATIC';

/** 数据源状态 */
export type DataSourceStatus = 0 | 1;

/** 请求方法 */
export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

/** API数据源配置 */
export interface ApiDataSourceConfig {
  type: 'API';
  url: string;
  method: HttpMethod;
  headers: string;
  params: string;
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
  data: string;
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
  scope: DataSourceScope;
  sourceType: DataSourceSourceType;
  variables?: Record<string, any>;
}

/** 页面事件类型 */
export type PageEventType =
  | 'onAddToFavorites'
  | 'onHide'
  | 'onLoad'
  | 'onPageScroll'
  | 'onPullDownRefresh'
  | 'onReachBottom'
  | 'onResize'
  | 'onShareAppMessage'
  | 'onShareTimeline'
  | 'onShow'
  | 'onTabItemTap'
  | 'onUnload';

/** 事件处理器类型 */
export type EventHandlerType = 'dataSource' | 'function';

/** 页面事件 */
export interface PageEvent {
  type: PageEventType;
  handlerType?: EventHandlerType;
  handler: {
    dsCode?: string;
    function?: string;
  };
}

/** 页面定义 */
export interface Page {
  /** 页面编码 */
  pageCode: string;
  /** 页面名称 */
  pageName: string;
  /** 页面数据源列表 */
  dataSources: DataSource[];
  /** 页面事件列表 */
  events: PageEvent[];
  components: ComponentInstance[];
}

export interface DataBinding {
  // 数据源编码，必填
  dsCode: string;
  // 数据路径，必填，如：data.list[0].name
  path: string;
  // 默认值，当数据源返回空或出错时使用
  defaultValue?: any;
  // 数据转换函数，可选
  transform?: string;
  // 自动刷新间隔（毫秒），可选
  refreshInterval?: number;
  // 是否在组件挂载时自动加载数据
  loadOnMount?: boolean;
}
