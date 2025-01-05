import type { Component } from '#/types/lowcode';

export const Alert: Component = {
  category: 'feedback',
  componentCode: 'Alert',
  componentName: '警告提示',
  defaultProps: {
    closable: false,
    showIcon: true,
    title: '提示',
    type: 'info',
  },
  icon: 'i-carbon:warning',
  propsSchema: {
    closable: {
      label: '可关闭',
      type: 'boolean',
    },
    showIcon: {
      label: '显示图标',
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
        width: {
          defaultValue: '100%',
          label: '宽度',
          type: 'string',
        },
      },
      type: 'object',
    },
    title: {
      label: '标题',
      type: 'string',
    },
    type: {
      label: '类型',
      options: [
        { label: '信息', value: 'info' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' },
      ],
      type: 'enum',
    },
  },
};
