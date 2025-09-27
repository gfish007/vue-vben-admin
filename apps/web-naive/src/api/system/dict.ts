import { requestClient } from '#/api/request';
import type { DictApi } from '#/api/system/dict.types';

/** 查询字典列表 */
export async function queryDictList(params: DictApi.QueryParams) {
  return requestClient.post<DictApi.QueryParams, DictApi.QueryParams & { records: DictApi.DictRecord[]; total: number; size: number; current: number }>('/open/dict/list', params);
}

/** 保存或更新字典 */
export async function saveOrUpdateDict(data: DictApi.DictSaveReq) {
  return requestClient.post<DictApi.DictSaveReq, { id: string }>('/open/dict/saveOrUpdate', data);
}

/** 删除字典 */
export async function deleteDicts(ids: string[]) {
  return requestClient.post<string[], number>('/open/dict/remove', ids);
}

/** 获取字典详情 */
export async function getDictDetail(id: string) {
  return requestClient.post<null, DictApi.DictRecord>(`/open/dict/${id}`);
}