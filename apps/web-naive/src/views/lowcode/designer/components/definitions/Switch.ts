import type { Component } from '#/types/lowcode';

export const Switch: Component = {
  category: 'form',
  componentCode: 'Switch',
  componentName: '开关',
  defaultProps: {
    disabled: false,
    loading: false,
    value: false,
  },
  icon: 'i-carbon:switch',
  propsSchema: {
    disabled: {
      label: '禁用',
      type: 'boolean',
    },
    loading: {
      label: '加载中',
      type: 'boolean',
    },
    style: {
      label: '样式',
      properties: {
        margin: {
          defaultValue: '0',
          label: '外边距',
          type: 'string',
        },
      },
      type: 'object',
    },
    value: {
      label: '值',
      type: 'boolean',
    },
  },
};
