import type { Component } from '#/types/lowcode';

export const List: Component = {
  category: 'data',
  componentCode: 'List',
  componentName: '列表',
  defaultProps: {
    bordered: true,
    hoverable: true,
    items: [
      { description: '描述1', title: '标题1' },
      { description: '描述2', title: '标题2' },
      { description: '描述3', title: '标题3' },
    ],
  },
  icon: 'i-carbon:list',
  propsSchema: {
    bordered: {
      label: '显示边框',
      type: 'boolean',
    },
    hoverable: {
      label: '悬浮效果',
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
    items: {
      label: '列表项',
      type: 'array',
      items: {
        label: '列表项',
        properties: {
          description: {
            label: '描述',
            type: 'string',
          },
          title: {
            label: '标题',
            type: 'string',
          },
        },
        type: 'object',
      },
    },
  },
};
