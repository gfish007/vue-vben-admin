import type { LiveSchedulingApi } from './liveScheduling.types';

import { requestClient } from '#/api/request';

/**
 * 查询直播排班列表
 */
export async function queryLiveSchedulingList(
  params: LiveSchedulingApi.QueryParams,
) {
  return requestClient.post<LiveSchedulingApi.QueryResult>(
    '/open/liveScheduling/list',
    params,
  );
}

/**
 * 保存或更新直播排班
 */
export async function saveOrUpdateLiveScheduling(
  params: LiveSchedulingApi.LiveSchedulingRecord,
) {
  return requestClient.post<LiveSchedulingApi.LiveSchedulingRecord>(
    '/open/liveScheduling/saveOrUpdate',
    params,
  );
}

/**
 * 获取直播排班详情
 */
export async function getLiveSchedulingDetail(id: number) {
  return requestClient.get<LiveSchedulingApi.LiveSchedulingRecord>(
    `/open/liveScheduling/${id}`,
  );
}

/**
 * 删除直播排班
 */
export async function deleteLiveSchedulings(ids: number[]) {
  return requestClient.delete<void>('/open/liveScheduling/remove', {
    data: ids,
  });
}

/**
 * 获取直播账号列表
 */
export async function getLiveAccountList() {
  return requestClient.post('/open/liveAccount/list', {
    page: { current: 1, size: 99_999 },
    queryBody: {},
  });
}

/**
 * 获取直播位置列表
 */
export async function getLiveLocationList() {
  return requestClient.post('/open/liveLocation/list', {
    page: { current: 1, size: 99_999 },
    queryBody: {},
  });
}
