import type { RecommendDetailApi } from './recommendDetail.types';

import { requestClient } from '#/api/request';

/**
 * 获取推荐详情列表
 */
export async function queryRecommendDetailList(
  recommendId: string,
): Promise<RecommendDetailApi.QueryResult> {
  return requestClient.get<RecommendDetailApi.QueryResult>(`/open/recommendation/detail/${recommendId}`);
}

/**
 * 保存或更新推荐详情
 */
export async function saveOrUpdateRecommendDetail(
  data: RecommendDetailApi.RecommendDetailSaveReq,
): Promise<void> {
  if (data.id) {
    // 更新操作
    return requestClient.post<void>(`/open/recommendation/saveOrUpdateDetail/${data.id}`, data);
  } else {
    // 新增操作
    return requestClient.post<void>('/open/recommendation/saveOrUpdateDetail', data);
  }
}

/**
 * 批量保存推荐详情
 */
export async function batchSaveRecommendDetails(
  regionId: string,
  data: RecommendDetailApi.RecommendDetailSaveReq[],
): Promise<void> {
  return requestClient.post<void>(`/open/recommendation/saveDetailList/${regionId}`, data);
}

/**
 * 删除推荐详情
 */
export async function deleteRecommendDetails(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/recommendation/removeDetail', { ids });
}