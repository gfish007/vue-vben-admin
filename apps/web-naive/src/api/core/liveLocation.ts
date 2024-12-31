import type { LiveLocationApi } from './liveLocation.types';

import { requestClient } from '#/api/request';

/**
 * 查询直播位置列表
 */
export async function queryLiveLocationList(
  params: LiveLocationApi.QueryParams,
) {
  return requestClient.post<LiveLocationApi.QueryResult>(
    '/open/liveLocation/list',
    params,
  );
}

/**
 * 保存或更新直播位置
 */
export async function saveOrUpdateLiveLocation(
  params: LiveLocationApi.LiveLocationRecord,
) {
  return requestClient.post<LiveLocationApi.LiveLocationRecord>(
    '/open/liveLocation/saveOrUpdate',
    params,
  );
}

/**
 * 获取直播位置详情
 */
export async function getLiveLocationDetail(id: number) {
  return requestClient.get<LiveLocationApi.LiveLocationRecord>(
    `/open/liveLocation/${id}`,
  );
}

/**
 * 删除直播位置
 */
export async function deleteLiveLocations(ids: number[]) {
  return requestClient.delete<void>('/open/liveLocation/remove', { data: ids });
}
