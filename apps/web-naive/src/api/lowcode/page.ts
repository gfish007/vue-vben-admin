import type { BasePageResult, BaseResponse } from '../../types/base';
import type { PageApi } from './page.types';

import { requestClient } from '../request';

/**
 * 查询页面列表
 */
export async function queryPageList(params: PageApi.QueryParams) {
  return requestClient.post<BaseResponse<BasePageResult<PageApi.QueryResult>>>(
    '/open/lcPage/list',
    params,
  );
}

/**
 * 保存或更新页面
 */
export async function saveOrUpdatePage(
  params: Omit<PageApi.QueryResult, 'id'>,
) {
  return requestClient.post<BaseResponse<PageApi.QueryResult>>(
    '/open/lcPage/saveOrUpdate',
    params,
  );
}

/**
 * 获取页面详情
 */
export async function getPageInfo(id: string) {
  return requestClient.get<BaseResponse<PageApi.QueryResult>>(
    `/open/lcPage/${id}`,
  );
}

/**
 * 删除页面
 */
export async function deletePages(id: string) {
  return requestClient.delete<BaseResponse<void>>(`/open/lcPage/${id}`);
}

/**
 * 发布页面
 */
export async function publishPage(id: string) {
  return requestClient.post<BaseResponse<void>>(`/open/lcPage/publish/${id}`);
}

/**
 * 禁用页面
 */
export async function disablePage(id: string) {
  return requestClient.post<BaseResponse<void>>(`/open/lcPage/disable/${id}`);
}

/**
 * 启用页面
 */
export async function enablePage(id: string) {
  return requestClient.post<BaseResponse<void>>(`/open/lcPage/enable/${id}`);
}

/**
 * 获取页面详情
 */
export function getPageDetail(params: { pageCode: string; version: string }) {
  return requestClient.get<BaseResponse<PageApi.QueryResult>>(
    `/open/lcPage/detail`,
    { params },
  );
}
