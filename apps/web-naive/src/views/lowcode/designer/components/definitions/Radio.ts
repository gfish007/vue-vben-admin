import type { Component } from '#/types/lowcode';

export const Radio: Component = {
  category: 'form',
  componentCode: 'Radio',
  componentName: '单选框',
  defaultProps: {
    disabled: false,
    options: [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
      { label: '选项3', value: '3' },
    ],
    value: '',
  },
  icon: 'i-carbon:radio-button',
  propsSchema: {
    disabled: {
      label: '禁用',
      type: 'boolean',
    },
    options: {
      label: '选项',
      type: 'array',
      items: {
        label: '选项',
        properties: {
          label: {
            label: '标签',
            type: 'string',
          },
          value: {
            label: '值',
            type: 'string',
          },
        },
        type: 'object',
      },
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
      type: 'string',
    },
  },
};
