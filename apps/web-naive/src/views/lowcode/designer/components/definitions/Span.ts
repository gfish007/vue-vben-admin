import type { Component } from '#/types/lowcode';

/**
 * 文本组件定义
 * 用于显示文本内容
 */
export const Span: Component = {
  // 组件分类
  category: 'display',
  componentCode: 'Span',
  componentName: '文本',
  // 默认属性
  defaultProps: {
    content: '文本内容1', // 显示的文本
    type: 'default', // 文本类型
  },
  // 默认样式
  defaultStyle: {
    backgroundColor: '#ffffff',
    border: '1px dashed #e8e8e8',
    borderRadius: '4px',
    boxSizing: 'border-box',
    color: '#333',
    display: 'block',
    flex: '0 0 auto', // 不伸缩
    fontSize: '14px',
    lineHeight: '1.5',
    minWidth: '0',
    padding: '8px',
    width: '100px', // 固定宽度
  },
  // 是否使用自定义属性面板
  hasCustomPropertyPanel: true,
  // 组件图标
  icon: 'text',
  // 属性配置面板
  propsSchema: {
    content: {
      defaultValue: '文本内容',
      label: '文本内容',
      type: 'input',
    },
    type: {
      defaultValue: 'default',
      label: '文本类型',
      options: [
        { label: '默认', value: 'default' },
        { label: '主要', value: 'primary' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' },
      ],
      type: 'select',
    },
  },
};
