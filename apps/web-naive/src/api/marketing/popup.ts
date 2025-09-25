import type { PopupApi } from './popup.types';

import { requestClient } from '#/api/request';

/**
 * 获取弹窗列表
 */
export async function queryPopupList(
  params: PopupApi.QueryParams,
): Promise<PopupApi.QueryResult> {
  return requestClient.post<PopupApi.QueryResult>('/open/popup/list', params);
}

/**
 * 保存或更新弹窗
 */
export async function saveOrUpdatePopup(
  data: PopupApi.PopupSaveReq,
): Promise<void> {
  return requestClient.post<void>('/open/popup/saveOrUpdate', data);
}

/**
 * 删除弹窗
 */
export async function deletePopups(ids: string[]): Promise<void> {
  return requestClient.post<void>('/open/popup/remove', { ids });
}

/**
 * 更新弹窗状态
 */
export async function updatePopupStatus(data: PopupApi.StatusReq): Promise<void> {
  return requestClient.post<void>('/open/popup/status', data);
}