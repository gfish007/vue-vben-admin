import { requestClient } from '#/api/request';

export async function querySysRoleList(params: any) {
  return requestClient.post<any>('/open/sysRole/list', params);
}

export async function saveOrUpdateSysRole(params: any) {
  return requestClient.post<any>('/open/sysRole/saveOrUpdate', params);
}

export async function getSysRoleDetail(id: number) {
  return requestClient.get<any>(`/open/sysRole/${id}`);
}

export async function deleteSysRoles(ids: number[]) {
  return requestClient.delete<void>('/open/sysRole/remove', { data: ids });
}
