import type { Component } from '#/types/lowcode';

/**
 * 容器组件定义
 * 用于布局和组织其他组件
 */
export const Container: Component = {
  // 组件分类
  category: 'layout',
  componentCode: 'Container',
  componentName: '容器',
  // 默认属性
  defaultProps: {
    align: 'stretch', // 交叉轴对齐
    direction: 'vertical', // 排列方向
    gap: 8, // 间距
    justify: 'flex-start', // 主轴对齐
  },
  // 默认样式
  defaultStyle: {
    backgroundColor: '#fafafa',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    minHeight: '120px',
    padding: '16px',
    width: '100%',
  },
  // 组件图标
  icon: 'layout',
  // 属性配置面板
  propsSchema: {
    align: {
      defaultValue: 'stretch',
      label: '交叉轴对齐',
      options: [
        { label: '拉伸', value: 'stretch' },
        { label: '起始', value: 'flex-start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'flex-end' },
      ],
      type: 'select',
    },
    direction: {
      defaultValue: 'vertical',
      label: '排列方向',
      options: [
        { label: '垂直', value: 'vertical' },
        { label: '水平', value: 'horizontal' },
      ],
      type: 'select',
    },
    gap: {
      defaultValue: 8,
      label: '间距',
      max: 48,
      min: 0,
      type: 'number',
    },
    justify: {
      defaultValue: 'flex-start',
      label: '主轴对齐',
      options: [
        { label: '起始', value: 'flex-start' },
        { label: '居中', value: 'center' },
        { label: '末尾', value: 'flex-end' },
        { label: '两端', value: 'space-between' },
        { label: '环绕', value: 'space-around' },
      ],
      type: 'select',
    },
  },
};
