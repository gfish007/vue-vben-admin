import type { Component } from '#/types/lowcode';

export const Table: Component = {
  category: 'data',
  componentCode: 'Table',
  componentName: '表格',
  defaultProps: {
    bordered: true,
    columns: [
      { key: 'col1', title: '列1', width: 200 },
      { key: 'col2', title: '列2', width: 200 },
      { key: 'col3', title: '列3', width: 200 },
    ],
    data: [
      { col1: '数据1-1', col2: '数据1-2', col3: '数据1-3' },
      { col1: '数据2-1', col2: '数据2-2', col3: '数据2-3' },
      { col1: '数据3-1', col2: '数据3-2', col3: '数据3-3' },
    ],
    size: 'medium',
    striped: false,
  },
  icon: 'i-carbon:table',
  propsSchema: {
    bordered: {
      label: '显示边框',
      type: 'boolean',
    },
    columns: {
      label: '列配置',
      type: 'array',
      items: {
        label: '列',
        properties: {
          key: {
            label: '键值',
            type: 'string',
          },
          title: {
            label: '标题',
            type: 'string',
          },
          width: {
            label: '宽度',
            type: 'number',
          },
        },
        type: 'object',
      },
    },
    data: {
      label: '数据',
      type: 'array',
      items: {
        label: '行数据',
        type: 'object',
      },
    },
    size: {
      label: '尺寸',
      options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'medium' },
        { label: '大', value: 'large' },
      ],
      type: 'enum',
    },
    striped: {
      label: '斑马纹',
      type: 'boolean',
    },
    style: {
      label: '样式',
      properties: {
        maxHeight: {
          defaultValue: 'none',
          label: '最大高度',
          type: 'string',
        },
        width: {
          defaultValue: '100%',
          label: '宽度',
          type: 'string',
        },
      },
      type: 'object',
    },
  },
};
