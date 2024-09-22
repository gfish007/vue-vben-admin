import type { RegionApi } from './region.types';

import { requestClient } from '#/api/request';

/**
 * 查询区域列表
 */
export async function queryRegionList(params: RegionApi.QueryParams) {
  return requestClient.post<RegionApi.QueryResult>('/open/region/list', params);
}

/**
 * 保存或更新区域
 */
export async function saveOrUpdateRegion(params: RegionApi.RegionSaveReq) {
  return requestClient.post<RegionApi.RegionRecord>(
    '/open/region/saveOrUpdate',
    params,
  );
}

/**
 * 获取区域详情
 */
export async function getRegionDetail(id: number) {
  return requestClient.get<RegionApi.RegionRecord>(`/open/region/${id}`);
}

/**
 * 删除区域
 */
export async function deleteRegions(ids: number[]) {
  return requestClient.delete<void>('/open/region/remove', { data: ids });
}

export function doTopRegion(regionId: number) {
  return requestClient.put<void>(`/open/region/doTop/${regionId}`);
}
