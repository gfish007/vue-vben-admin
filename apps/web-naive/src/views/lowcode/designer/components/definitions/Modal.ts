import type { Component } from '#/types/lowcode';

export const Modal: Component = {
  category: 'feedback',
  componentCode: 'Modal',
  componentName: '对话框',
  defaultProps: {
    closable: true,
    maskClosable: true,
    preset: 'dialog',
    title: '对话框标题',
    visible: false,
    width: '520px',
  },
  icon: 'i-carbon:popup',
  propsSchema: {
    closable: {
      label: '显示关闭按钮',
      type: 'boolean',
    },
    maskClosable: {
      label: '点击遮罩关闭',
      type: 'boolean',
    },
    preset: {
      label: '预设类型',
      options: [
        { label: '对话框', value: 'dialog' },
        { label: '卡片', value: 'card' },
      ],
      type: 'enum',
    },
    style: {
      label: '样式',
      properties: {
        maxHeight: {
          defaultValue: 'none',
          label: '最大高度',
          type: 'string',
        },
      },
      type: 'object',
    },
    title: {
      label: '标题',
      type: 'string',
    },
    visible: {
      label: '显示',
      type: 'boolean',
    },
    width: {
      label: '宽度',
      type: 'string',
    },
  },
};
