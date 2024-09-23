import { requestClient } from '#/api/request';

export interface MenuQueryParams {
  page: {
    current: number;
    size: number;
  };
  queryBody: {
    name?: string;
  };
}

export interface MenuSaveReq {
  id?: number;
  path: string;
  name: string;
  component: string;
  redirect: string;
  parentId: string;
  metaInfo: {
    icon: string;
    keepAlive: boolean;
    order: number;
    title: string;
  };
  sortNo: number;
}

export async function getMenuList(params: MenuQueryParams) {
  return requestClient.post<any>('/open/sysMenu/list', params);
}

export async function saveOrUpdateMenu(params: MenuSaveReq) {
  return requestClient.post<any>('/open/sysMenu/saveOrUpdate', params);
}

export async function removeMenu(ids: number[]) {
  return requestClient.delete<void>('/open/sysMenu/remove', { data: ids });
}

export async function getMenuDetail(id: number) {
  return requestClient.get<any>(`/open/sysMenu/${id}`);
}

export async function getAllMenuList() {
  const params = {
    page: {
      current: 1,
      size: 1000, // 设置一个较大的值以获取所有菜单
    },
    queryBody: {},
  };
  const response = await requestClient.post<any>('/open/sysMenu/list', params);
  // 按 sortNo 排序
  response.records.sort((a: any, b: any) => a.sortNo - b.sortNo);
  return response;
}
