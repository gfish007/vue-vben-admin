import type { ComponentApi } from './component.types';
import { requestClient } from '#/api/request';

/** 获取组件列表 */
export async function getComponentList() {
  return requestClient.get<ComponentApi.ComponentRecord[]>('/open/lowcode/component/list');
}

/** 获取组件详情 */
export async function getComponentDetail(componentCode: string) {
  return requestClient.get<ComponentApi.ComponentRecord>(`/open/lowcode/component/${componentCode}`);
} 
