import { requestClient } from '#/api/request';

export function querySysUserList(data: any) {
  return requestClient.post('/open/sysUser/list', data);
}

export function getSysUserDetail(id: number) {
  return requestClient.get(`/open/sysUser/${id}`);
}

export function saveOrUpdateSysUser(data: any) {
  return requestClient.post('/open/sysUser/saveOrUpdate', data);
}

export function deleteSysUsers(ids: number[]) {
  return requestClient.post('/open/sysUser/remove', ids);
}

export function enableSysUser(id: number) {
  return requestClient.delete(`/open/sysUser/normal/${id}`);
}

export function disableSysUser(id: number) {
  return requestClient.put(`/open/sysUser/forbidden/${id}`);
}
