import type { BasePageResult, BaseResponse } from '../../types/base';
import type { DataSource } from '../../types/lowcode';
import type { DataSourceApi } from './dataSource.types';

import { requestClient } from '../request';

/**
 * 查询数据源列表
 */
export async function queryDataSourceList(params: DataSourceApi.QueryParams) {
  return requestClient.post<
    BaseResponse<BasePageResult<DataSourceApi.QueryResult>>
  >('/open/lcDatasource/list', params);
}

/**
 * 保存或更新数据源
 */
export async function saveOrUpdateDataSource(params: Omit<DataSource, 'id'>) {
  return requestClient.post<BaseResponse<DataSource>>(
    '/open/lcDatasource/saveOrUpdate',
    params,
  );
}

/**
 * 获取数据源详情
 */
export async function getDataSourceDetail(id: string) {
  return requestClient.get<BaseResponse<DataSource>>(
    `/open/lcDatasource/${id}`,
  );
}

/**
 * 删除数据源
 */
export async function deleteDataSource(id: string) {
  return requestClient.delete<BaseResponse<void>>(`/open/lcDatasource/${id}`);
}
