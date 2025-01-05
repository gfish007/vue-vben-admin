import type { Component } from '#/types/lowcode';

import { InputRender } from './InputRender';

export const Input: Component = {
  category: 'form',
  componentCode: 'Input',
  componentName: '输入框',
  defaultProps: {
    clearable: true,
    disabled: false,
    placeholder: '请输入',
    type: 'text',
  },
  icon: 'i-carbon:text-input',
  propsSchema: {
    clearable: {
      label: '可清除',
      type: 'boolean',
    },
    disabled: {
      label: '禁用',
      type: 'boolean',
    },
    placeholder: {
      label: '提示文本',
      type: 'string',
    },
    style: {
      label: '样式',
      properties: {
        height: {
          defaultValue: '32px',
          label: '高度',
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
    type: {
      label: '类型',
      options: [
        { label: '文本', value: 'text' },
        { label: '密码', value: 'password' },
        { label: '数字', value: 'number' },
      ],
      type: 'enum',
    },
  },
  render: InputRender,
};
