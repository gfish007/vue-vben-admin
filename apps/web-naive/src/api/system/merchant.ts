import type { MerchantApi } from './merchant.types';

import { requestClient } from '#/api/request';

/**
 * 查询商户列表
 * @param params 查询参数
 * @returns 商户列表
 */
export async function queryMerchantList(
  params: MerchantApi.QueryParams,
): Promise<MerchantApi.QueryResult> {
  return requestClient.post<MerchantApi.QueryResult>('/open/merchant/list', params);
}

/**
 * 保存或更新商户
 * @param data 商户数据
 * @returns 
 */
export async function saveOrUpdateMerchant(
  data: MerchantApi.MerchantSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/merchant/saveOrUpdate', data);
}

/**
 * 删除商户
 * @param ids 商户ID列表
 * @returns 
 */
export async function deleteMerchants(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/merchant/remove', ids);
}

/**
 * 获取商户详情
 * @param id 商户ID
 * @returns 商户详情
 */
export async function getMerchantDetail(id: string): Promise<MerchantApi.MerchantRecord> {
  return requestClient.get<MerchantApi.MerchantRecord>(`/open/merchant/${id}`);
}

/**
 * 审核商户
 * @param data 审核数据
 * @returns 
 */
export async function auditMerchant(data: MerchantApi.AuditReq): Promise<void> {
  return requestClient.post<void>('/open/merchant/audit', data);
}

/**
 * 启用/禁用商户
 * @param data 状态数据
 * @returns 
 */
export async function updateMerchantStatus(data: MerchantApi.StatusReq): Promise<void> {
  return requestClient.post<void>('/open/merchant/status', data);
}