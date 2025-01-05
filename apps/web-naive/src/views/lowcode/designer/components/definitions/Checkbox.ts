import type { Component } from '#/types/lowcode';

export const Checkbox: Component = {
  category: 'form',
  componentCode: 'Checkbox',
  componentName: '复选框',
  defaultProps: {
    disabled: false,
    indeterminate: false,
    label: '复选框',
    value: false,
  },
  icon: 'i-carbon:checkbox',
  propsSchema: {
    disabled: {
      label: '禁用',
      type: 'boolean',
    },
    indeterminate: {
      label: '半选状态',
      type: 'boolean',
    },
    label: {
      label: '标签',
      type: 'string',
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
