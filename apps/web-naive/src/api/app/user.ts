import type { UserApi } from './user.types';

import { requestClient } from '#/api/request';

export async function queryUserList(
  params: UserApi.QueryParams,
): Promise<UserApi.QueryResult> {
  return requestClient.post<UserApi.QueryResult>('/open/user/list', params);
}

export async function disableUser(id: string): Promise<void> {
  return requestClient.put<void>(`/open/user/disable/${id}`);
}

export async function enableUser(id: string): Promise<void> {
  return requestClient.put<void>(`/open/user/enable/${id}`);
}
