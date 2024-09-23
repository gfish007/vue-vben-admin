import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/open/sysUser/getUserInfo');
}

// export async function queryUserList(params: any) {
//   return requestClient.post<any>('/open/sysUser/list', params);
// }

// export async function saveOrUpdateUser(params: any) {
//   return requestClient.post<any>('/open/sysUser/saveOrUpdate', params);
// }

// export async function getUserDetail(id: number) {
//   return requestClient.get<any>(`/open/sysUser/${id}`);
// }

// export async function deleteUser(ids: number[]) {
//   return requestClient.delete<void>('/open/sysUser/remove', { data: ids });
// }
