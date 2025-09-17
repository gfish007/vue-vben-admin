import type { SvcApi } from './svc.types';

import { requestClient } from '#/api/request';

/**
 * 查询 SVC 服务列表
 */
export async function querySvcList(
  params: SvcApi.QueryParams & { regionId?: string },
) {
  const { regionId, ...queryParams } = params;
  const url = (regionId !== undefined && regionId !== null) 
    ? `/open/svc/list/${regionId}` 
    : '/open/svc/list';
  return requestClient.post<SvcApi.QueryResult>(url, queryParams);
}

/**
 * 保存或更新 SVC 服务
 */
export async function saveOrUpdateSvc(
  params: SvcApi.SvcSaveReq,
) {
  return requestClient.post<SvcApi.SvcRecord>(
    '/open/svc/saveOrUpdate',
    params,
  );
}

/**
 * 获取 SVC 服务详情
 */
export async function getSvcDetail(id: number) {
  return requestClient.get<SvcApi.SvcRecord>(
    `/open/svc/${id}`,
  );
}

/**
 * 删除 SVC 服务
 */
export async function deleteSvcs(ids: number[]) {
  return requestClient.delete<void>('/open/svc/remove', {
    data: ids,
  });
}

/**
 * 发布 SVC 服务
 */
export function publishSvc(id: number) {
  return requestClient.put<void>(`/open/svc/publish/${id}`);
}

/**
 * 撤回 SVC 服务
 */
export function rollbackSvc(id: number) {
  return requestClient.put<void>(`/open/svc/rollback/${id}`);
}

/**
 * 驳回 SVC 服务
 */
export function rejectSvc(id: number) {
  return requestClient.put<void>(`/open/svc/reject/${id}`);
}

/**
 * 通过 SVC 服务
 */
export function approveSvc(id: number) {
  return requestClient.put<void>(`/open/svc/approved/${id}`);
}