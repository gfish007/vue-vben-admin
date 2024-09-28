import type { RegionActivityApi } from './regionActivity.types';

import { requestClient } from '#/api/request';

/**
 * 查询区域活动列表
 */
export async function queryRegionActivityList(
  params: RegionActivityApi.QueryParams,
) {
  return requestClient.post<RegionActivityApi.QueryResult>(
    '/open/regionActivity/list',
    params,
  );
}

/**
 * 保存或更新区域活动
 */
export async function saveOrUpdateRegionActivity(
  params: RegionActivityApi.RegionActivitySaveReq,
) {
  return requestClient.post<RegionActivityApi.RegionActivityRecord>(
    '/open/regionActivity/saveOrUpdate',
    params,
  );
}

/**
 * 获取区域活动详情
 */
export async function getRegionActivityDetail(id: number) {
  return requestClient.get<RegionActivityApi.RegionActivityRecord>(
    `/open/regionActivity/${id}`,
  );
}

/**
 * 删除区域活动
 */
export async function deleteRegionActivities(ids: number[]) {
  return requestClient.delete<void>('/open/regionActivity/remove', {
    data: ids,
  });
}

/**
 * 发布区域活动
 */
export function publishRegionActivity(id: number) {
  return requestClient.put<void>(`/open/regionActivity/publish/${id}`);
}

/**
 * 撤回区域活动
 */
export function rollbackRegionActivity(id: number) {
  return requestClient.put<void>(`/open/regionActivity/rollback/${id}`);
}

/**
 * 驳回区域活动
 */
export function rejectRegionActivity(id: number) {
  return requestClient.put<void>(`/open/regionActivity/reject/${id}`);
}

/**
 * 通过区域活动
 */
export function approveRegionActivity(id: number) {
  return requestClient.put<void>(`/open/regionActivity/approved/${id}`);
}
