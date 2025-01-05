import type { Component } from '#/types/lowcode';

export const Message: Component = {
  category: 'feedback',
  componentCode: 'Message',
  componentName: '消息提示',
  defaultProps: {
    closable: true,
    content: '这是一条消息',
    duration: 3000,
    showIcon: true,
    type: 'info',
  },
  icon: 'i-carbon:notification',
  propsSchema: {
    closable: {
      label: '可关闭',
      type: 'boolean',
    },
    content: {
      label: '内容',
      type: 'string',
    },
    duration: {
      label: '显示时长(ms)',
      type: 'number',
    },
    showIcon: {
      label: '显示图标',
      type: 'boolean',
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
