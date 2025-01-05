import type { Component } from '#/types/lowcode';

export const Card: Component = {
  category: 'layout',
  componentCode: 'Card',
  componentName: '卡片',
  defaultProps: {
    bordered: true,
    hoverable: false,
    title: '卡片标题',
  },
  icon: 'i-carbon:card',
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
        background: {
          defaultValue: '#ffffff',
          label: '背景色',
          type: 'string',
        },
        borderRadius: {
          defaultValue: '4px',
          label: '圆角',
          type: 'string',
        },
        margin: {
          defaultValue: '0',
          label: '外边距',
          type: 'string',
        },
        padding: {
          defaultValue: '16px',
          label: '内边距',
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
  },
};
