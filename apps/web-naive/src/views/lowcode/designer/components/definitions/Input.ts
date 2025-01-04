import type { Component } from '#/types/lowcode';
import { InputRender } from './InputRender';

export const Input: Component = {
  componentCode: 'Input',
  componentName: '输入框',
  componentType: 'FORM',
  category: '表单',
  icon: 'i-carbon-text-input',
  isContainer: false,
  fullWidth: false,
  status: 1,
  propsSchema: {
    placeholder: {
      type: 'string',
      label: '提示文本',
    },
    type: {
      type: 'enum',
      label: '类型',
      options: [
        { label: '文本', value: 'text' },
        { label: '密码', value: 'password' },
        { label: '数字', value: 'number' },
      ],
    },
    disabled: {
      type: 'boolean',
      label: '禁用',
    },
    clearable: {
      type: 'boolean',
      label: '可清除',
    },
  },
  defaultProps: {
    placeholder: '请输入',
    type: 'text',
    disabled: false,
    clearable: true,
    style: {
      width: '100%',
      height: '32px',
    },
  },
  render: InputRender,
}; 
