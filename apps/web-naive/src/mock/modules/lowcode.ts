import type { DataSource } from '../../types/lowcode';

interface MockRequest {
  body: any;
  query: Record<string, string>;
}

let mockDataSources: DataSource[] = [];

export default [
  {
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: mockDataSources,
        message: 'ok',
      };
    },
    url: '/mock/lowcode/dataSource/list',
  },
  {
    method: 'post',
    response: ({ body }: MockRequest) => {
      const dataSource = body as DataSource;
      const index = mockDataSources.findIndex((ds) => ds.id === dataSource.id);
      if (index > -1) {
        mockDataSources[index] = dataSource;
      } else {
        mockDataSources.push(dataSource);
      }
      return {
        code: 0,
        data: dataSource,
        message: 'ok',
      };
    },
    url: '/mock/lowcode/dataSource/saveOrUpdate',
  },
  {
    method: 'get',
    response: ({ query }: MockRequest) => {
      const dataSource = mockDataSources.find((ds) => ds.id === query.id);
      return {
        code: 0,
        data: dataSource,
        message: 'ok',
      };
    },
    url: '/mock/lowcode/dataSource/:id',
  },
  {
    method: 'delete',
    response: ({ query }: MockRequest) => {
      mockDataSources = mockDataSources.filter((ds) => ds.id !== query.id);
      return {
        code: 0,
        message: 'ok',
      };
    },
    url: '/mock/lowcode/dataSource/:id',
  },
];
