import type { Component } from '#/types/lowcode';
import { ContainerRender } from './ContainerRender';

export const Container: Component = {
  componentName: '容器',
  componentCode: 'Container',
  componentType: 'CONTAINER',
  category: '基础组件',
  isContainer: true,
  status: 1,
  // 定义属性面板的 tab 结构
  propPanelTabs: [
    {
      name: 'props',
      label: '属性',
      fields: [
        'display',
        'flexDirection',
        'justifyContent',
        'alignItems',
      ],
    },
    {
      name: 'style',
      label: '样式',
      fields: ['style'],
    },
  ],
  propsSchema: {
    display: {
      type: 'enum',
      label: '布局方式',
      options: [
        { label: '块级', value: 'block' },
        { label: '弹性', value: 'flex' },
      ],
    },
    flexDirection: {
      type: 'enum',
      label: '主轴方向',
      options: [
        { label: '水平', value: 'row' },
        { label: '垂直', value: 'column' },
      ],
      showOn: {
        display: ['flex'],
      },
    },
    justifyContent: {
      type: 'enum',
      label: '主轴对齐',
      options: [
        { label: '起始', value: 'flex-start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'flex-end' },
        { label: '两端', value: 'space-between' },
        { label: '环绕', value: 'space-around' },
      ],
      showOn: {
        display: ['flex'],
      },
    },
    alignItems: {
      type: 'enum',
      label: '交叉轴对齐',
      options: [
        { label: '起始', value: 'flex-start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'flex-end' },
        { label: '拉伸', value: 'stretch' },
      ],
      showOn: {
        display: ['flex'],
      },
    },
  },
  defaultProps: {
    display: 'block',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    style: {
      width: '100%',
    },
  },
  render: ContainerRender,
}; 
