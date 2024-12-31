import type { LiveMemberApi } from './liveMember.types';

import { requestClient } from '#/api/request';

/**
 * 查询直播成员列表
 */
export async function queryLiveMemberList(params: LiveMemberApi.QueryParams) {
  return requestClient.post<LiveMemberApi.QueryResult>(
    '/open/liveMember/list',
    params,
  );
}

/**
 * 保存或更新直播成员
 */
export async function saveOrUpdateLiveMember(
  params: LiveMemberApi.LiveMemberRecord,
) {
  return requestClient.post<LiveMemberApi.LiveMemberRecord>(
    '/open/liveMember/saveOrUpdate',
    params,
  );
}

/**
 * 获取直播成员详情
 */
export async function getLiveMemberDetail(id: number) {
  return requestClient.get<LiveMemberApi.LiveMemberRecord>(
    `/open/liveMember/${id}`,
  );
}

/**
 * 删除直播成员
 */
export async function deleteLiveMembers(ids: number[]) {
  return requestClient.delete<void>('/open/liveMember/remove', { data: ids });
}
