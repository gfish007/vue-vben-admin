import type { PageApi } from './page.types';
import { requestClient } from '#/api/request';
import { mockPageDetail } from './_mock';

/** 查询页面列表 */
export async function queryPageList(params: PageApi.QueryParams) {
  // return requestClient.post<PageApi.QueryResult>('/open/lcPageConfig/list', params);
  
  // Mock response
  return Promise.resolve({
    total: 2,
    records: [
      {
        id: 1,
        pageCode: 'test_page',
        pageName: '测试页面',
        pageType: 'FORM',
        status: 1,
        gmtCreate: '2024-01-01 00:00:00',
        gmtModified: '2024-01-01 00:00:00',
      },
      {
        id: 2,
        pageCode: 'test_page2',
        pageName: '测试页面2',
        pageType: 'LIST',
        status: 1,
        gmtCreate: '2024-01-01 00:00:00',
        gmtModified: '2024-01-01 00:00:00',
      },
    ],
  });
}

/** 获取页面详情 */
export async function getPageDetail(pageCode: string) {
  // return requestClient.get<PageApi.PageRecord>(`/open/lcPageConfig/page/${id}`);
  
  // Mock response
  return Promise.resolve({
    ...mockPageDetail,
    pageCode,
  });
}

/** 保存或更新页面 */
export async function saveOrUpdatePage(params: PageApi.PageRecord) {
  // return requestClient.post<PageApi.PageRecord>('/open/lcPageConfig/saveOrUpdate', params);
  
  // Mock response
  return Promise.resolve({
    ...mockPageDetail,
    ...params,
  });
}

/** 删除页面 */
export async function deletePages(ids: number[]) {
  // return requestClient.delete<void>('/open/lcPageConfig/remove', { data: ids });
  
  // Mock response
  return Promise.resolve();
} 
