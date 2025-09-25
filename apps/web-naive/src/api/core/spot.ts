import type { SpotApi } from './spot.types';

import { requestClient } from '#/api/request';

export async function querySpotList(
  params: SpotApi.QueryParams & { regionId?: string },
): Promise<SpotApi.QueryResult> {
  const { regionId, ...queryParams } = params;
  const url = (regionId !== undefined && regionId !== null) 
    ? `/open/regionSpot/list/${regionId}` 
    : '/open/regionSpot/list';
  return requestClient.post<SpotApi.QueryResult>(url, queryParams);
}

export async function getSpotDetail(id: number): Promise<SpotApi.SpotRecord> {
  return requestClient.get<SpotApi.SpotRecord>(`/open/regionSpot/${id}`);
}

export async function saveOrUpdateSpot(
  data: SpotApi.SpotSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/regionSpot/saveOrUpdate', data);
}

export async function deleteSpots(ids: number[]): Promise<void> {
  return requestClient.delete<void>('/open/regionSpot/remove', { data: ids });
}

/**
 * 启用地点
 */
export async function enableSpot(spotId: number): Promise<void> {
  return requestClient.put<void>(`/open/regionSpot/enable/${spotId}`);
}

/**
 * 禁用地点
 */
export async function disableSpot(spotId: number): Promise<void> {
  return requestClient.put<void>(`/open/regionSpot/disable/${spotId}`);
}