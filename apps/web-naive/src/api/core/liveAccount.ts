import type { LiveAccountApi } from './liveAccount.types';

import { requestClient } from '#/api/request';

/**
 * 查询直播账户列表
 */
export async function queryLiveAccountList(params: LiveAccountApi.QueryParams) {
  return requestClient.post<LiveAccountApi.QueryResult>(
    '/open/liveAccount/list',
    params,
  );
}

/**
 * 保存或更新直播账户
 */
export async function saveOrUpdateLiveAccount(
  params: LiveAccountApi.LiveAccountRecord,
) {
  return requestClient.post<LiveAccountApi.LiveAccountRecord>(
    '/open/liveAccount/saveOrUpdate',
    params,
  );
}

/**
 * 获取直播账户详情
 */
export async function getLiveAccountDetail(id: number) {
  return requestClient.get<LiveAccountApi.LiveAccountRecord>(
    `/open/liveAccount/${id}`,
  );
}

/**
 * 删除直播账户
 */
export async function deleteLiveAccounts(ids: number[]) {
  return requestClient.delete<void>('/open/liveAccount/remove', { data: ids });
}
