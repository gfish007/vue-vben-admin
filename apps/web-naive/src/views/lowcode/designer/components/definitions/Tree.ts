import type { Component } from '#/types/lowcode';

export const Tree: Component = {
  category: 'data',
  componentCode: 'Tree',
  componentName: '树形控件',
  defaultProps: {
    checkable: false,
    data: [
      {
        key: '1',
        label: '节点1',
        children: [
          { label: '节点1-1', key: '1-1' },
          { label: '节点1-2', key: '1-2' },
        ],
      },
      {
        key: '2',
        label: '节点2',
        children: [
          { label: '节点2-1', key: '2-1' },
          { label: '节点2-2', key: '2-2' },
        ],
      },
    ],
    expandOnClick: true,
    selectable: true,
  },
  icon: 'i-carbon:tree',
  propsSchema: {
    checkable: {
      label: '显示复选框',
      type: 'boolean',
    },
    data: {
      label: '数据',
      type: 'array',
      items: {
        label: '节点',
        properties: {
          key: {
            label: '键值',
            type: 'string',
          },
          label: {
            label: '标签',
            type: 'string',
          },
          children: {
            type: 'array',
            label: '子节点',
          },
        },
        type: 'object',
      },
    },
    expandOnClick: {
      label: '点击展开',
      type: 'boolean',
    },
    selectable: {
      label: '可选择',
      type: 'boolean',
    },
    style: {
      label: '样式',
      properties: {
        maxHeight: {
          defaultValue: 'none',
          label: '最大高度',
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
