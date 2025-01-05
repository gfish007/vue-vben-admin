import type { Component } from '#/types/lowcode';

export const Select: Component = {
  category: 'form',
  componentCode: 'Select',
  componentName: '选择器',
  defaultProps: {
    clearable: true,
    disabled: false,
    multiple: false,
    options: [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
      { label: '选项3', value: '3' },
    ],
    placeholder: '请选择',
  },
  icon: 'i-carbon:list-dropdown',
  propsSchema: {
    clearable: {
      label: '可清除',
      type: 'boolean',
    },
    disabled: {
      label: '禁用',
      type: 'boolean',
    },
    multiple: {
      label: '多选',
      type: 'boolean',
    },
    options: {
      label: '选项',
      type: 'array',
      items: {
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
    placeholder: {
      label: '提示文本',
      type: 'string',
    },
    style: {
      label: '样式',
      properties: {
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
