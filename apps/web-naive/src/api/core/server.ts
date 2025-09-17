import type { ServerApi } from './server.types';

import { requestClient } from '#/api/request';

/**
 * 查询地区服务列表
 */
export async function queryServerList(
  params: ServerApi.QueryParams & { regionId?: string },
) {
  const { regionId, ...queryParams } = params;
  const url = (regionId !== undefined && regionId !== null) 
    ? `/open/server/list/${regionId}` 
    : '/open/server/list';
  return requestClient.post<ServerApi.QueryResult>(url, queryParams);
}

/**
 * 保存或更新地区服务
 */
export async function saveOrUpdateServer(
  params: ServerApi.ServerSaveReq,
) {
  return requestClient.post<ServerApi.ServerRecord>(
    '/open/server/saveOrUpdate',
    params,
  );
}

/**
 * 获取地区服务详情
 */
export async function getServerDetail(id: number) {
  return requestClient.get<ServerApi.ServerRecord>(
    `/open/server/${id}`,
  );
}

/**
 * 删除地区服务
 */
export async function deleteServers(ids: number[]) {
  return requestClient.delete<void>('/open/server/remove', {
    data: ids,
  });
}

/**
 * 发布地区服务
 */
export function publishServer(id: number) {
  return requestClient.put<void>(`/open/server/publish/${id}`);
}

/**
 * 撤回地区服务
 */
export function rollbackServer(id: number) {
  return requestClient.put<void>(`/open/server/rollback/${id}`);
}

/**
 * 驳回地区服务
 */
export function rejectServer(id: number) {
  return requestClient.put<void>(`/open/server/reject/${id}`);
}

/**
 * 通过地区服务
 */
export function approveServer(id: number) {
  return requestClient.put<void>(`/open/server/approved/${id}`);
}