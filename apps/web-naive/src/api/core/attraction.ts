import type { AttractionApi } from './attraction.types';

import { requestClient } from '#/api/request';

/**
 * 查询景点列表
 */
export async function queryAttractionList(params: AttractionApi.QueryParams) {
  return requestClient.post<AttractionApi.QueryResult>(
    '/open/attraction/list',
    params,
  );
}

/**
 * 保存或更新景点
 */
export async function saveOrUpdateAttraction(
  params: AttractionApi.AttractionSaveReq,
) {
  return requestClient.post<AttractionApi.AttractionRecord>(
    '/open/attraction/saveOrUpdate',
    params,
  );
}

/**
 * 获取景点详情
 */
export async function getAttractionDetail(id: number) {
  return requestClient.get<AttractionApi.AttractionRecord>(
    `/open/attraction/${id}`,
  );
}

/**
 * 删除景点
 */
export async function deleteAttractions(ids: number[]) {
  return requestClient.post<void>('/open/attraction/remove', ids);
}

/**
 * 置顶景点
 */
export function doTopAttraction(attractionId: number) {
  return requestClient.put<void>(`/open/attraction/doTop/${attractionId}`);
}

// 添加发布接口
export function publishAttraction(id: string) {
  return requestClient.put<void>(`/open/attraction/publish/${id}`);
}

// 添加撤回接口
export function unpublishAttraction(id: number) {
  return requestClient.put<void>(`/open/attraction/unpublish/${id}`);
}
