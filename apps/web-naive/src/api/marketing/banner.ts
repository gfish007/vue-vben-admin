import type { BannerApi } from './banner.types';

import { requestClient } from '#/api/request';

/**
 * 查询Banner列表
 * @param params 查询参数
 * @returns Banner列表
 */
export async function queryBannerList(
  params: BannerApi.QueryParams,
): Promise<BannerApi.QueryResult> {
  return requestClient.post<BannerApi.QueryResult>('/open/banner/list', params);
}

/**
 * 保存或更新Banner
 * @param data Banner数据
 * @returns 
 */
export async function saveOrUpdateBanner(
  data: BannerApi.BannerSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/banner/saveOrUpdate', data);
}

/**
 * 删除Banner
 * @param ids Banner ID列表
 * @returns 
 */
export async function deleteBanners(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/banner/remove', ids);
}

/**
 * 启用/禁用Banner
 * @param data 状态数据
 * @returns 
 */
export async function updateBannerStatus(data: BannerApi.StatusReq): Promise<void> {
  return requestClient.post<void>('/open/banner/status', data);
}