import type { RecommendApi } from './recommend.types';

import { requestClient } from '#/api/request';

/**
 * 获取推荐列表
 */
export async function queryRecommendList(
  params: RecommendApi.QueryParams,
): Promise<RecommendApi.QueryResult> {
  return requestClient.post<RecommendApi.QueryResult>('/open/recommendation/list', params);
}

/**
 * 保存或更新推荐
 */
export async function saveOrUpdateRecommend(
  data: RecommendApi.RecommendSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/recommendation/saveOrUpdate', data);
}

/**
 * 删除推荐
 */
export async function deleteRecommends(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/recommendation/remove', ids );
}

/**
 * 更新推荐状态
 */
export async function updateRecommendStatus(data: RecommendApi.StatusReq): Promise<void> {
  return requestClient.post<void>('/open/recommendation/status', data);
}
