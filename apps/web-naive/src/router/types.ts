import type { RouteRecordRaw } from 'vue-router';

export interface RouteMeta {
  title: string;
  icon?: string;
  orderNo?: number;
  roles?: string[];
  ignoreAuth?: boolean;
  hideMenu?: boolean;
}

export interface AppRouteModule extends Omit<RouteRecordRaw, 'meta'> {
  name: string;
  meta: RouteMeta;
  component?: any;
  components?: any;
  children?: AppRouteModule[];
  props?: any;
  fullPath?: string;
}
