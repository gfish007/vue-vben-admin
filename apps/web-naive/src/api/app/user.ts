import { requestClient } from '#/api/request';

export async function queryUserList(params: any) {
  return requestClient.post<any>('/open/user/list', params);
}

export async function enableUser(userId: number) {
  return requestClient.put<void>(`/open/user/normal/${userId}`);
}

export async function disableUser(userId: number) {
  return requestClient.put<void>(`/open/user/forbidden/${userId}`);
}
