import type { DiamondAreaApi } from './diamondArea.types';

import { requestClient } from '#/api/request';

/**
 * 查询金刚区列表
 * @param params 查询参数
 * @returns 金刚区列表
 */
export async function queryDiamondAreaList(
  params: DiamondAreaApi.QueryParams,
): Promise<DiamondAreaApi.QueryResult> {
  return requestClient.post<DiamondAreaApi.QueryResult>('/open/diamondArea/list', params);
}

/**
 * 保存或更新金刚区
 * @param data 金刚区数据
 * @returns 
 */
export async function saveOrUpdateDiamondArea(
  data: DiamondAreaApi.DiamondAreaSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/diamondArea/saveOrUpdate', data);
}

/**
 * 删除金刚区
 * @param ids 金刚区ID列表
 * @returns 
 */
export async function deleteDiamondAreas(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/diamondArea/remove', ids);
}

/**
 * 启用/禁用金刚区
 * @param data 状态数据
 * @returns 
 */
export async function updateDiamondAreaStatus(data: DiamondAreaApi.StatusReq): Promise<void> {
  return requestClient.post<void>('/open/diamondArea/status', data);
}