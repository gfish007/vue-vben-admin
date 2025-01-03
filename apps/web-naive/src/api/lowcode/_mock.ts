import type { PageApi } from './page.types';

// Mock 页面数据
export const mockPageDetail: PageApi.PageRecord = {
  id: 1,
  tenantId: 'default',
  pageCode: 'test_page',
  pageName: '测试页面',
  pageType: 'FORM',
  status: 1,
  layoutConfig: {
    components: [
      {
        id: 1,
        tenantId: 'default',
        pageCode: 'test_page',
        version: '1.0.0',
        componentInstanceId: 'form_1',
        parentInstanceId: null,
        componentCode: 'n-form',
        props: {
          labelPlacement: 'left',
          labelWidth: 100,
          size: 'medium',
        },
        sortOrder: 0,
      },
      {
        id: 2,
        tenantId: 'default',
        pageCode: 'test_page',
        version: '1.0.0',
        componentInstanceId: 'input_1',
        parentInstanceId: 'form_1',
        componentCode: 'n-input',
        props: {
          placeholder: '请输入',
          type: 'text',
          clearable: true,
        },
        sortOrder: 0,
      },
      {
        id: 3,
        tenantId: 'default',
        pageCode: 'test_page',
        version: '1.0.0',
        componentInstanceId: 'select_1',
        parentInstanceId: 'form_1',
        componentCode: 'n-select',
        props: {
          placeholder: '请选择',
          options: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
          ],
          clearable: true,
        },
        sortOrder: 1,
      },
    ],
  },
  gmtCreate: '2024-01-01 00:00:00',
  gmtModified: '2024-01-01 00:00:00',
}; 
