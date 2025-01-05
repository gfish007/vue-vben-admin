import type { Component } from '#/types/lowcode';

export const Grid: Component = {
  category: 'layout',
  componentCode: 'Grid',
  componentName: '栅格',
  defaultProps: {
    columns: 24,
    gap: '16px',
  },
  icon: 'i-carbon:grid',
  propsSchema: {
    columns: {
      defaultValue: 24,
      label: '列数',
      type: 'number',
    },
    gap: {
      label: '间距',
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
        padding: {
          defaultValue: '0',
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
  },
};
