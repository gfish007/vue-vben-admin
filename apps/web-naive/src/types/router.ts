import type { RouteRecordRaw } from 'vue-router';

// 扩展路由记录类型
export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'children'> {
  name: string;
  meta?: {
    title?: string;
    icon?: string;
    hideMenu?: boolean;
    [key: string]: any;
  };
  children?: AppRouteRecordRaw[];
  props?: boolean | Record<string, any> | ((to: any) => Record<string, any>);
} 
